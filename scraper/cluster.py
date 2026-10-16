"""Dedup + story merging. Stdlib only.

1. Exact dedup: normalize URL (strip query/fragment/trailing slash) and title
   (lowercase, strip punctuation); drop exact matches, keep the earliest.
2. Story clustering: Jaccard word-overlap on (title + first sentence tokens).
   If similarity > 0.55, merge into one story: the item with the longest text
   becomes primary, the others attach as related [{source, url}].
"""

import re
from urllib.parse import urlsplit, urlunsplit

from summarize import tokenize  # reuse the same tokenization

MERGE_THRESHOLD = 0.55


def canonical_url(url):
    """Normalize a URL for dedup: strip query/fragment/trailing slash."""
    if not url:
        return ""
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return url.strip()
    netloc = parts.netloc.lower()
    path = parts.path.rstrip("/") or "/"
    # Drop default ports for cleanliness
    if netloc.endswith(":80"):
        netloc = netloc[:-3]
    elif netloc.endswith(":443"):
        netloc = netloc[:-4]
    return urlunsplit((parts.scheme.lower(), netloc, path, "", ""))


def normalize_title(title):
    """Lowercase, strip punctuation, collapse whitespace."""
    t = (title or "").lower()
    t = re.sub(r"[^\w\s]", " ", t, flags=re.UNICODE)
    return re.sub(r"\s+", " ", t).strip()


def _story_tokens(item):
    """Token set of title + first sentence, for clustering."""
    from summarize import split_sentences
    text = item.get("text") or ""
    first = split_sentences(text)[0] if text.strip() else ""
    return set(tokenize(item.get("title", "") + " " + first))


def _jaccard(a, b):
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _sort_key(item):
    dt = item.get("published_dt")
    return (dt is None, -(dt.timestamp() if dt else 0))


def dedupe_and_merge(items):
    """Dedupe exact copies, then merge same-story coverage.

    Returns a list of primary items, each with an added "related" list of
    {"source":..., "url":...} dicts. Primaries keep their original fields.
    """
    # ---- 1. Exact dedup (keep earliest; undated copies lose to dated ones) ----
    seen_urls = {}
    seen_titles = {}

    def _dedup_key(item):
        dt = item.get("published_dt")
        return (dt is None, dt.timestamp() if dt else 0.0)

    for item in sorted(items, key=_dedup_key):  # earliest first, undated last
        curl = canonical_url(item.get("url"))
        ntitle = normalize_title(item.get("title"))
        if curl and curl in seen_urls:
            continue
        if ntitle and ntitle in seen_titles:
            continue
        if curl:
            seen_urls[curl] = item
        if ntitle:
            seen_titles[ntitle] = item
    unique = list(seen_urls.values())
    # Items with no URL at all were keyed by title only; merge both maps.
    for ntitle, item in seen_titles.items():
        if item not in unique:
            unique.append(item)

    for item in unique:
        item["_curl"] = canonical_url(item.get("url"))
        item["_tokens"] = _story_tokens(item)

    # ---- 2. Greedy story clustering (newest first for stable results) ----
    clusters = []  # each: {"primary": item, "members": [item, ...]}
    for item in sorted(unique, key=_sort_key):
        placed = False
        for cluster in clusters:
            if _jaccard(item["_tokens"], cluster["primary"]["_tokens"]) > MERGE_THRESHOLD:
                cluster["members"].append(item)
                placed = True
                break
        if not placed:
            clusters.append({"primary": item, "members": [item]})

    # ---- 3. Primary = longest text; rest become related ----
    primaries = []
    for cluster in clusters:
        members = cluster["members"]
        primary = max(members, key=lambda m: len(m.get("text") or ""))
        related = [
            {"source": m.get("source", ""), "url": m.get("url", "")}
            for m in members if m is not primary
        ]
        # De-dupe related by source (keep first URL per outlet)
        seen_src, deduped = set(), []
        for r in related:
            if r["source"] not in seen_src:
                seen_src.add(r["source"])
                deduped.append(r)
        primary["related"] = deduped
        primaries.append(primary)

    # Clean internal fields
    for item in primaries:
        item.pop("_curl", None)
        item.pop("_tokens", None)

    # Newest first, undated last
    primaries.sort(key=_sort_key)
    return primaries
