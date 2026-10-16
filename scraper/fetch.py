"""Polite concurrent fetching of RSS/Atom feeds. Stdlib only.

Rules (per design doc §3.3):
- User-Agent: NewsIntelBot/1.0 (+https://newsintel-ai.vercel.app)
- 20s timeout per feed, 2 retries with backoff
- ThreadPoolExecutor with 8 workers
- A single feed failing must NEVER crash the run: log to stderr, continue.
"""

import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

USER_AGENT = "NewsIntelBot/1.0 (+https://newsintel-ai.vercel.app)"
TIMEOUT = 20          # seconds per request
MAX_RETRIES = 2       # retries after the initial attempt (3 attempts total)
BACKOFF_BASE = 2      # seconds; sleeps 2s, then 4s
WORKERS = 8
MAX_BYTES = 5 * 1024 * 1024  # refuse absurdly large feeds (5 MB)


def _fetch_one(url):
    """Fetch one URL. Returns bytes, or raises on final failure."""
    last_exc = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                if resp.status != 200:
                    raise urllib.error.HTTPError(url, resp.status, resp.reason, resp.headers, None)
                return resp.read(MAX_BYTES + 1)[:MAX_BYTES]
        except Exception as exc:  # noqa: BLE001 - any failure is retryable/loggable
            last_exc = exc
            if attempt < MAX_RETRIES:
                time.sleep(BACKOFF_BASE * (2 ** attempt))
    raise last_exc


def fetch_all(feeds):
    """Fetch every feed concurrently.

    Args:
        feeds: list of (category, source_name, url) tuples.

    Returns:
        list of dicts, one per feed, in input order:
        {"category":..., "source":..., "url":..., "ok":bool,
         "data": bytes|None, "error": str|None}
    A failed feed yields ok=False; the run continues regardless.
    """
    def work(feed):
        category, source, url = feed
        try:
            data = _fetch_one(url)
            return {"category": category, "source": source, "url": url,
                    "ok": True, "data": data, "error": None}
        except Exception as exc:  # noqa: BLE001 - must never propagate
            msg = f"[fetch] FAILED {source} <{url}>: {type(exc).__name__}: {exc}"
            print(msg, file=sys.stderr)
            return {"category": category, "source": source, "url": url,
                    "ok": False, "data": None, "error": f"{type(exc).__name__}: {exc}"}

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        return list(pool.map(work, feeds))
