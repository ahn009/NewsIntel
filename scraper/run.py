#!/usr/bin/env python3
"""NewsIntel automated news pipeline — entrypoint.

Pipeline: fetch (RSS) -> parse -> dedupe/merge -> summarize -> write JSON.
Stdlib only. A failing feed never crashes the run.

Usage:  python3 scraper/run.py
Output: public/news/{latest,top20,world,pakistan,tech,business,science,sports}.json
        (resolved relative to the repo root = parent of scraper/)
"""

import sys
import time
from pathlib import Path

# Allow `python3 scraper/run.py` from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from feeds import FEEDS, CATEGORIES          # noqa: E402
from fetch import fetch_all                 # noqa: E402
from parse import parse_feed                # noqa: E402
from cluster import dedupe_and_merge        # noqa: E402
from summarize import summarize, make_brief  # noqa: E402
from rank import rank_top20                 # noqa: E402
from output import build_story, write_all, build_briefing, write_top20  # noqa: E402


def main():
    t0 = time.time()
    repo_root = Path(__file__).resolve().parent.parent
    out_dir = repo_root / "public" / "news"

    # ---- 1. Fetch ----
    results = fetch_all(FEEDS)
    ok = [r for r in results if r["ok"]]
    failed = [r for r in results if not r["ok"]]
    feed_status = {
        r["url"]: ("ok" if r["ok"] else f"failed: {r['error']}")
        for r in results
    }

    # ---- 2. Parse ----
    all_items = []
    per_feed_counts = {}
    for r in ok:
        items = parse_feed(r["data"], r["source"], r["category"])
        per_feed_counts[f"{r['source']} ({r['category']})"] = len(items)
        all_items.extend(items)
    fetched_total = len(all_items)

    # ---- 3. Dedupe + merge into stories ----
    primaries = dedupe_and_merge(all_items)

    # ---- 4. Summarize each primary + rank the Top-20 briefing ----
    summaries = {}
    stories = []
    for item in primaries:
        summary = summarize(item.get("text") or "", title=item.get("title") or "")
        summaries[id(item)] = summary
        stories.append(build_story(item, summary))

    ranked = rank_top20(primaries, all_items)
    briefings = []
    for rank, (item, _score, _coverage) in enumerate(ranked, start=1):
        brief = make_brief(summaries.get(id(item), []),
                           title=item.get("title") or "")
        briefings.append(build_briefing(item, brief, rank))

    # ---- 5. Write JSON ----
    written = write_all(stories, out_dir, feed_status)
    written.append(write_top20(briefings, out_dir, feed_status))

    # ---- 6. Report ----
    elapsed = time.time() - t0
    cat_counts = {c: sum(1 for s in stories if s["category"] == c) for c in CATEGORIES}
    print("== NewsIntel scrape complete ==")
    print(f"feeds: {len(ok)} ok / {len(failed)} failed (of {len(FEEDS)})")
    for r in failed:
        print(f"  FAILED: {r['source']} <{r['url']}> -> {r['error']}")
    print(f"items fetched (<=36h, <=40/feed): {fetched_total}")
    print(f"stories after dedupe/merge: {len(stories)}")
    print(f"top-20 briefing: {len(briefings)} stories")
    for b in briefings[:5]:
        print(f"  #{b['rank']:2d} [{b['source']}] {b['title'][:72]}")
    print("per-category: " + ", ".join(f"{c}={cat_counts[c]}" for c in CATEGORIES))
    print("output:")
    for p in written:
        print(f"  {p} ({p.stat().st_size // 1024} KB)")
    print(f"elapsed: {elapsed:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
