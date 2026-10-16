# NewsIntel 📡

**Automated world + Pakistan news briefings. No AI, no API keys, no sign-up — open the link and read.**

Every hour, a scheduled job fetches ~20 free RSS feeds (BBC, Al Jazeera, The Guardian, NPR, Dawn, Express Tribune, TechCrunch and more), merges duplicate coverage of the same story, and writes a 3-sentence extractive summary for each story using a pure-Python TextRank summarizer. The results are committed as static JSON and the site redeploys automatically.

**Live:** https://newsintel-ai.vercel.app/

## How it works

```
RSS feeds ──▶ Python scraper (stdlib only) ──▶ public/news/*.json ──▶ Vercel static site
                  ▲                                      │
                  │            GitHub Actions, hourly     │
                  └──────────────────────────────────────┘
```

- `scraper/` — the pipeline: `feeds.py` (source list) → `fetch.py` (polite concurrent
  fetching) → `parse.py` (RSS/Atom parsing) → `summarize.py` (TextRank extractive
  summarizer, no LLM) → `cluster.py` (dedup + story merging) → `output.py` (JSON).
- `.github/workflows/news-scrape.yml` — runs the pipeline hourly and commits the JSON.
- `src/` — React dashboard that reads `/news/*.json`. Zero backend, zero secrets.

## Cost

$0/month. RSS is free, GitHub Actions minutes are free and unlimited on public repos,
Vercel Hobby is free, and the summarizer is ~90 lines of dependency-free Python.

## Run the scraper locally

```bash
python3 scraper/run.py
# writes public/news/latest.json + per-category files
```

## Fork it

Fork this repo, and the hourly workflow runs on your fork automatically — your own
news site with zero setup. (GitHub Actions is enabled by default on public forks.)
