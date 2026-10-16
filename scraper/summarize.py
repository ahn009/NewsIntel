"""Extractive TextRank summarizer. Pure Python, stdlib only.

Picks the most important sentences verbatim from the source text — no LLM,
no model downloads, no API. Every summary sentence is the publisher's own words.

Algorithm (design doc §5.2):
1. Split into sentences (regex on [.!?] + capital, abbreviations protected).
2. Tokenize: lowercase, alpha tokens len>2, minus embedded stopword list.
3. TextRank: similarity matrix shared_words / (log(len_a)+log(len_b)),
   PageRank ITERATIONS times with DAMPING.
4. Select top MAX_SENTENCES (40-280 chars each), skip near-duplicates
   (>70% word overlap with an already-chosen sentence), restore order.
5. Fallbacks: <2 sentences -> text as-is; empty -> title.
"""

import math
import re

# ---- Tunable knobs (all at top, per spec) ----
MAX_SENTENCES = 3
MIN_SENT_LEN = 40
MAX_SENT_LEN = 280
DAMPING = 0.85
ITERATIONS = 20
NEAR_DUP_OVERLAP = 0.70

# Boilerplate tails some feeds append ("Continue reading...") — never summary-worthy.
BOILERPLATE_RE = re.compile(
    r"^(continue reading|read more|click here|learn more|subscribe|sign up|"
    r"follow .* on|share this|advertisement)\b", re.IGNORECASE)

# Periods inside these abbreviations must not split sentences.
ABBREVIATIONS = [
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "St",
    "U.S", "U.K", "E.U", "U.N",
    "e.g", "i.e", "vs", "etc", "a.m", "p.m",
    "No", "Fig", "approx", "Dept", "Gov", "Rep", "Sen", "Gen", "Col",
]

# ~150 common English stopwords (embedded, no downloads).
STOPWORDS = frozenset("""
a about above after again against all almost also always am among an and any are
as at be because been before being below between both but by can cannot could
did do does doing don down during each even ever every few for from further
get had has have having he her here hers herself him himself his how however
i if in into is it its itself just like many may me more most much must my
myself never new no nor not now of off often on once only or other ought our
ours ourselves out over own same say says said she should since so some still
such than that the their theirs them themselves then there these they this
those through to too under until up very was we were what when where which
while who whom why will with would you your yours yourself yourselves
one two three also across per within without may might must shall
""".split())


def _protect_abbreviations(text):
    for abbr in ABBREVIATIONS:
        text = text.replace(abbr + ".", abbr + "\x00")
    return text


def _restore_abbreviations(text):
    return text.replace("\x00", ".")


def split_sentences(text):
    """Split text into sentences, protecting abbreviations."""
    if not text:
        return []
    protected = _protect_abbreviations(text)
    # Split after sentence-ending punctuation followed by whitespace + capital.
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])", protected)
    # Fallback: plain split on punctuation if the lookahead found nothing
    # (e.g. lowercase-start sentences).
    if len(parts) == 1:
        parts = re.split(r"(?<=[.!?])\s+", protected)
    sentences = [_restore_abbreviations(p).strip() for p in parts]
    return [s for s in sentences if s]


def tokenize(sentence):
    """Lowercase alpha tokens len>2, minus stopwords."""
    words = re.findall(r"[a-zA-Z]+", sentence.lower())
    return [w for w in words if len(w) > 2 and w not in STOPWORDS]


def _similarity(tokens_a, tokens_b):
    if not tokens_a or not tokens_b:
        return 0.0
    shared = len(set(tokens_a) & set(tokens_b))
    if shared == 0:
        return 0.0
    denom = math.log(len(tokens_a)) + math.log(len(tokens_b))
    if denom <= 0:
        return 0.0
    return shared / denom


def _pagerank(sim):
    """PageRank over the similarity matrix. Returns score per sentence."""
    n = len(sim)
    scores = [1.0] * n
    out_weight = [sum(row) for row in sim]
    for _ in range(ITERATIONS):
        new_scores = []
        for i in range(n):
            rank = 0.0
            for j in range(n):
                if i == j or out_weight[j] == 0:
                    continue
                rank += scores[j] * sim[j][i] / out_weight[j]
            new_scores.append((1 - DAMPING) + DAMPING * rank)
        scores = new_scores
    return scores


def _overlap_ratio(tokens_a, tokens_b):
    if not tokens_a or not tokens_b:
        return 0.0
    inter = len(set(tokens_a) & set(tokens_b))
    return inter / max(len(set(tokens_a)), len(set(tokens_b)))


def summarize(text, title=""):
    """Return a list of summary sentences (best effort, never raises)."""
    try:
        return _summarize(text, title)
    except Exception:
        # Absolute fallback: summarizer must never break the pipeline.
        clean = (text or "").strip()
        if clean:
            return [clean[:MAX_SENT_LEN]]
        return [title] if title else []


BRIEF_MAX_SENTENCES = 2
BRIEF_MAX_WORDS = 55


def make_brief(summary_sentences, title=""):
    """Condense a summary into a 1-2 sentence briefing line (~55 words max).

    Used for the Top-20 briefing view: the reader gets the gist without
    opening the article. Never raises; falls back to the title.
    """
    try:
        parts = []
        word_count = 0
        for s in (summary_sentences or [])[:BRIEF_MAX_SENTENCES]:
            s = (s or "").strip()
            if not s:
                continue
            n_words = len(s.split())
            if parts and word_count + n_words > BRIEF_MAX_WORDS:
                break
            parts.append(s)
            word_count += n_words
        text = " ".join(parts).strip()
        if len(text.split()) > BRIEF_MAX_WORDS:
            text = " ".join(text.split()[:BRIEF_MAX_WORDS]).rstrip(",;:") + "…"
        if text:
            return text
    except Exception:
        pass
    return (title or "").strip()


def _summarize(text, title=""):
    text = (text or "").strip()
    if not text:
        return [title] if title else []

    sentences = split_sentences(text)
    if len(sentences) < 2:
        return [text[:MAX_SENT_LEN]] if text else ([title] if title else [])

    tokenized = [tokenize(s) for s in sentences]
    n = len(sentences)

    # Similarity matrix (TextRank graph edges).
    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = _similarity(tokenized[i], tokenized[j])

    # If nothing is similar to anything, fall back to lead sentences.
    if all(w == 0.0 for row in sim for w in row):
        ranked = list(range(n))
    else:
        scores = _pagerank(sim)
        ranked = sorted(range(n), key=lambda i: scores[i], reverse=True)

    # Select: length filter + boilerplate filter + near-duplicate rejection,
    # then restore order.
    chosen = []
    chosen_tokens = []
    for i in ranked:
        s = sentences[i]
        if BOILERPLATE_RE.search(s):
            continue
        if not (MIN_SENT_LEN <= len(s) <= MAX_SENT_LEN):
            continue
        toks = tokenized[i]
        if any(_overlap_ratio(toks, ct) > NEAR_DUP_OVERLAP for ct in chosen_tokens):
            continue
        chosen.append(i)
        chosen_tokens.append(toks)
        if len(chosen) >= MAX_SENTENCES:
            break

    # If filters were too strict, relax: take top-ranked regardless of length
    # (but still skip boilerplate).
    if not chosen:
        for i in ranked[:MAX_SENTENCES]:
            if not BOILERPLATE_RE.search(sentences[i]):
                chosen.append(i)

    # Last resort: never return an empty summary.
    if not chosen:
        for s in sentences:
            if not BOILERPLATE_RE.search(s):
                return [s[:MAX_SENT_LEN]]
        return [title] if title else []

    chosen.sort()
    return [sentences[i] for i in chosen]
