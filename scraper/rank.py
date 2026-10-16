"""Top-20 briefing ranking. Stdlib only.

Ranks merged stories by importance so the site can lead with a concise
"Top 20 big news" briefing instead of a long article list.

Score per story = coverage * 3 + source_tier * 2 + recency, where:
- coverage: how many outlets carry the same story. Counted over the
  pre-dedupe item pool with Jaccard >= COVERAGE_THRESHOLD on
  (title + first-sentence) tokens — a deliberately looser bar than the
  0.55 merge threshold, because outlets word the same story differently.
- source_tier: 3 = major international outlets, 2 = major national/trade
  outlets, 1 = aggregators/niche.
- recency: 1.0 for brand-new, decaying to 0 over 48 hours.
"""

from datetime import datetime, timezone

from summarize import tokenize, split_sentences

TOP_N = 20
COVERAGE_THRESHOLD = 0.35
RECENCY_HALF_LIFE_HOURS = 48.0
# Only tier-2+ outlets are eligible for the Top-20 briefing: aggregators and
# niche feeds (Hacker News, ScienceDaily) stay in their category feeds but are
# not "big world news". (HN comment text also pollutes coverage scoring.)
TOP20_MIN_TIER = 2

SOURCE_TIERS = {
    # Tier 3 — major international outlets
    "BBC News": 3,
    "Al Jazeera": 3,
    "The Guardian": 3,
    "NPR": 3,
    # Tier 2 — major national / trade / sports outlets
    "Dawn": 2,
    "Express Tribune": 2,
    "TechCrunch": 2,
    "BBC Sport": 2,
    "ESPN": 2,
    # Tier 1 — aggregators / niche
    "Hacker News": 1,
    "ScienceDaily": 1,
}


def _story_tokens(item):
    """Token set of title + first sentence (same recipe as cluster.py)."""
    text = item.get("text") or ""
    first = split_sentences(text)[0] if text.strip() else ""
    return set(tokenize(item.get("title", "") + " " + first))


def _jaccard(a, b):
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _age_hours(item):
    dt = item.get("published_dt")
    if dt is None:
        return RECENCY_HALF_LIFE_HOURS  # undated -> no recency boost
    try:
        now = datetime.now(timezone.utc)
        return max(0.0, (now - dt).total_seconds() / 3600.0)
    except Exception:
        return RECENCY_HALF_LIFE_HOURS


def _coverage(primary, all_items, primary_tokens):
    """How many distinct items cover the same story (loose threshold)."""
    count = 0
    for other in all_items:
        if other is primary:
            continue
        if _jaccard(primary_tokens, _story_tokens(other)) >= COVERAGE_THRESHOLD:
            count += 1
    return count


def _score(item, coverage):
    tier = SOURCE_TIERS.get(item.get("source", ""), 1)
    recency = max(0.0, 1.0 - _age_hours(item) / RECENCY_HALF_LIFE_HOURS)
    return coverage * 3.0 + tier * 2.0 + recency


def rank_top20(primaries, all_items):
    """Return [(item, score, coverage)] for the top TOP_N stories, best first.

    Only tier-TOP20_MIN_TIER+ outlets are eligible (no aggregators/niche).
    """
    tokens_cache = {id(item): _story_tokens(item) for item in all_items}
    eligible = [p for p in primaries
                if SOURCE_TIERS.get(p.get("source", ""), 1) >= TOP20_MIN_TIER]
    scored = []
    for primary in eligible:
        coverage = _coverage(primary, all_items, tokens_cache[id(primary)])
        scored.append((primary, _score(primary, coverage), coverage))
    scored.sort(key=lambda t: t[1], reverse=True)
    return scored[:TOP_N]
