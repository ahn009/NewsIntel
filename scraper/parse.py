"""Parse RSS 2.0 and Atom feeds into normalized items. Stdlib only.

Normalized item dict:
    {
        "title": str,
        "url": str,
        "published_at": "2026-10-16T12:34:00Z" | None,
        "published_dt": datetime|None   # internal, for sorting/filtering
        "text": str,                     # article body from feed (HTML stripped)
        "image": str|None,
        "feed_categories": [str],
        "source": str,                   # outlet name from feeds.py
        "category": str,                 # our category from feeds.py
    }

Field map (design doc §4):
- title:       RSS title / Atom title
- url:         RSS link / Atom link[@href] (rel alternate or bare)
- published:   RSS pubDate / Atom published|updated  -> UTC ISO 8601
- text:        content:encoded -> description  /  content -> summary (HTML stripped)
- image:       media:content/@url or enclosure(type=image/*)
               / Atom link rel=enclosure type=image/*
- Items kept from the last 36h only; bad/missing dates sort last; cap 40/feed.
"""

import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser

RECENT_HOURS = 36
MAX_PER_FEED = 40

NS_CONTENT = "http://purl.org/rss/1.0/modules/content/"
NS_MEDIA = "http://search.yahoo.com/mrss/"
NS_ATOM = "http://www.w3.org/2005/Atom"


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def get_text(self):
        return "".join(self._parts)


def strip_html(html):
    """Strip HTML tags, unescape entities, collapse whitespace."""
    if not html:
        return ""
    s = _HTMLStripper()
    try:
        s.feed(html)
    except Exception:  # noqa: BLE001 - malformed HTML must not crash parsing
        return re.sub(r"<[^>]+>", " ", html)
    text = s.get_text()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _local(tag):
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def _ns(tag):
    return tag[1:].split("}", 1)[0] if tag.startswith("{") else ""


def _children_by_local(elem, localname):
    return [c for c in elem if _local(c.tag) == localname]


def _first_text(elem, localname):
    kids = _children_by_local(elem, localname)
    if not kids:
        return ""
    # itertext() handles mixed content like <title>Story <b>One</b></title>
    return "".join(kids[0].itertext()).strip()


def _parse_date(raw):
    """Return aware UTC datetime, or None."""
    if not raw or not raw.strip():
        return None
    raw = raw.strip()
    # RFC 2822 (RSS pubDate)
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError):
        pass
    # ISO 8601 (Atom published/updated)
    try:
        iso = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


def _iso_z(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _rss_image(item):
    # media:content with image type (or any url as fallback)
    for c in item:
        if _local(c.tag) == "content" and _ns(c.tag) == NS_MEDIA:
            url = (c.get("url") or "").strip()
            if url:
                return url
    # enclosure
    for enc in _children_by_local(item, "enclosure"):
        if (enc.get("type") or "").startswith("image"):
            url = (enc.get("url") or "").strip()
            if url:
                return url
    return None


def _rss_text(item):
    # Prefer content:encoded, fall back to description
    for c in item:
        if _local(c.tag) == "encoded" and _ns(c.tag) == NS_CONTENT:
            inner = "".join(c.itertext()).strip()
            if inner:
                return strip_html(inner)
    return strip_html(_first_text(item, "description"))


def _parse_rss_item(item, source, category):
    title = strip_html(_first_text(item, "title"))
    url = _first_text(item, "link").strip()
    dt = _parse_date(_first_text(item, "pubDate"))
    text = _rss_text(item)
    image = _rss_image(item)
    cats = [c.text.strip() for c in _children_by_local(item, "category") if c.text and c.text.strip()]
    return {
        "title": title, "url": url,
        "published_at": _iso_z(dt) if dt else None,
        "published_dt": dt,
        "text": text, "image": image,
        "feed_categories": cats, "source": source, "category": category,
    }


def _atom_link(entry, rel_wanted):
    for link in _children_by_local(entry, "link"):
        rel = (link.get("rel") or "alternate").strip()
        href = (link.get("href") or "").strip()
        if not href:
            continue
        if rel_wanted == "alternate" and rel in ("alternate", ""):
            return href
        if rel_wanted == "enclosure" and rel == "enclosure":
            if (link.get("type") or "").startswith("image"):
                return href
    return None


def _atom_text(entry):
    for c in entry:
        if _local(c.tag) == "content" and _ns(c.tag) in (NS_ATOM, ""):
            inner = "".join(c.itertext()).strip()
            if inner:
                return strip_html(inner)
    return strip_html(_first_text(entry, "summary"))


def _parse_atom_entry(entry, source, category):
    title = strip_html(_first_text(entry, "title"))
    url = _atom_link(entry, "alternate") or ""
    dt = _parse_date(_first_text(entry, "published")) or _parse_date(_first_text(entry, "updated"))
    text = _atom_text(entry)
    image = _atom_link(entry, "enclosure")
    cats = [c.get("term", "").strip() for c in _children_by_local(entry, "category") if c.get("term")]
    return {
        "title": title, "url": url,
        "published_at": _iso_z(dt) if dt else None,
        "published_dt": dt,
        "text": text, "image": image,
        "feed_categories": cats, "source": source, "category": category,
    }


def parse_feed(data, source, category):
    """Parse one feed's XML bytes -> list of normalized items.

    Never raises: XML errors are logged to stderr and yield [].
    """
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        print(f"[parse] FAILED {source}: XML parse error: {exc}", file=sys.stderr)
        return []

    items = []
    root_local = _local(root.tag)
    if root_local == "feed":  # Atom
        for entry in _children_by_local(root, "entry"):
            items.append(_parse_atom_entry(entry, source, category))
    else:  # RSS 2.0 (rss/channel/item) or RDF
        for item in root.iter():
            if _local(item.tag) == "item":
                items.append(_parse_rss_item(item, source, category))

    # Drop items with no title and no URL at all
    items = [i for i in items if i["title"] or i["url"]]

    # Keep items from the last RECENT_HOURS; items with missing/unparseable
    # dates are kept (can't prove stale) but sort last.
    cutoff = datetime.now(timezone.utc) - timedelta(hours=RECENT_HOURS)
    items = [i for i in items
             if i["published_dt"] is None or i["published_dt"] >= cutoff]

    # Newest first, undated last; cap per feed pre-merge.
    items.sort(key=lambda i: (i["published_dt"] is None,
                              -(i["published_dt"].timestamp()
                                if i["published_dt"] else 0)))
    return items[:MAX_PER_FEED]
