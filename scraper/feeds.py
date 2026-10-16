"""NewsIntel feed list.

Every feed below was verified live on 2026-10-16 (HTTP 200 + valid RSS/Atom XML).
Each entry is a (category, source_name, url) tuple.

Categories: world, pakistan, tech, business, science, sports.
"""

FEEDS = [
    # ---- World ----
    ("world", "BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml"),
    ("world", "Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
    ("world", "The Guardian", "https://www.theguardian.com/world/rss"),
    ("world", "NPR", "https://feeds.npr.org/1001/rss.xml"),
    # ---- Pakistan ----
    ("pakistan", "Dawn", "https://www.dawn.com/feeds/home"),
    ("pakistan", "Dawn", "https://www.dawn.com/feeds/pakistan"),
    ("pakistan", "Express Tribune", "https://tribune.com.pk/feed/home"),
    ("pakistan", "Express Tribune", "https://tribune.com.pk/feed/pakistan"),
    # ---- Tech ----
    ("tech", "BBC News", "https://feeds.bbci.co.uk/news/technology/rss.xml"),
    ("tech", "The Guardian", "https://www.theguardian.com/technology/rss"),
    ("tech", "TechCrunch", "https://techcrunch.com/feed/"),
    ("tech", "Hacker News", "https://hnrss.org/frontpage"),
    # ---- Business ----
    ("business", "BBC News", "https://feeds.bbci.co.uk/news/business/rss.xml"),
    ("business", "The Guardian", "https://www.theguardian.com/business/rss"),
    # ---- Science ----
    ("science", "BBC News", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"),
    ("science", "ScienceDaily", "https://www.sciencedaily.com/rss/top/science.xml"),
    # ---- Sports ----
    ("sports", "BBC Sport", "https://feeds.bbci.co.uk/sport/rss.xml"),
    ("sports", "The Guardian", "https://www.theguardian.com/sport/rss"),
    ("sports", "ESPN", "https://www.espn.com/espn/rss/news"),
]

CATEGORIES = ["world", "pakistan", "tech", "business", "science", "sports"]

assert len(FEEDS) == 19, f"expected 19 verified feeds, got {len(FEEDS)}"
assert all(c in CATEGORIES for c, _, _ in FEEDS)
# The Al Jazeera section feed https://www.aljazeera.com/xml/rss/economy.xml
# 404s (verified 2026-10-16) and must NOT be added here.
assert not any("economy.xml" in url for _, _, url in FEEDS)
