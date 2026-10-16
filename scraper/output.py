"""Write the static JSON news files. Stdlib only.

Output (design doc §7):
- latest.json — top ~60 merged stories, newest first
- world.json, pakistan.json, tech.json, business.json, science.json, sports.json
  — top ~40 per category
- Each file: {generated_at, story_count, feed_status, stories:[...]}
- Story: {id (sha1 of canonical url), title, summary [sentences], source,
          url, image|null, published_at, category, related [{source, url}]}
"""

import hashlib
import json
from datetime import datetime, timezone

from feeds import CATEGORIES
from cluster import canonical_url

LATEST_LIMIT = 60
CATEGORY_LIMIT = 40


def _now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _story_id(item):
    curl = canonical_url(item.get("url") or item.get("title") or "")
    return hashlib.sha1(curl.encode("utf-8")).hexdigest()


def build_story(item, summary_sentences):
    return {
        "id": _story_id(item),
        "title": item.get("title", ""),
        "summary": summary_sentences,
        "source": item.get("source", ""),
        "url": item.get("url", ""),
        "image": item.get("image") or None,
        "published_at": item.get("published_at"),
        "category": item.get("category", ""),
        "related": item.get("related", []),
    }


def build_briefing(item, brief_text, rank):
    """One entry of the Top-20 briefing: rank + ultra-concise summary."""
    return {
        "id": _story_id(item),
        "rank": rank,
        "title": item.get("title", ""),
        "brief": brief_text,
        "source": item.get("source", ""),
        "url": item.get("url", ""),
        "image": item.get("image") or None,
        "published_at": item.get("published_at"),
        "category": item.get("category", ""),
    }


def _envelope(stories, feed_status):
    return {
        "generated_at": _now_iso(),
        "story_count": len(stories),
        "feed_status": feed_status,
        "stories": stories,
    }


def write_all(stories, out_dir, feed_status):
    """Write latest.json + per-category files. Returns list of paths written."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []

    latest = stories[:LATEST_LIMIT]
    path = out_dir / "latest.json"
    path.write_text(json.dumps(_envelope(latest, feed_status),
                               ensure_ascii=False, indent=1),
                    encoding="utf-8")
    written.append(path)

    for cat in CATEGORIES:
        cat_stories = [s for s in stories if s["category"] == cat][:CATEGORY_LIMIT]
        path = out_dir / f"{cat}.json"
        path.write_text(json.dumps(_envelope(cat_stories, feed_status),
                                   ensure_ascii=False, indent=1),
                        encoding="utf-8")
        written.append(path)

    return written


def write_top20(briefings, out_dir, feed_status):
    """Write top20.json — the ranked Top-20 briefing. Returns the path."""
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "top20.json"
    path.write_text(json.dumps(_envelope(briefings, feed_status),
                               ensure_ascii=False, indent=1),
                    encoding="utf-8")
    return path
