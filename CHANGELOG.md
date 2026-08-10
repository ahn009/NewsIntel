# Changelog

All notable changes to NewsIntel are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.1] — 2026-08-10

### Fixed
- Removed the unsupported `citation_options` request field from Groq Compound; Compound continues to add web-search citations automatically

## [1.1.0] — 2026-08-10

### Changed
- Replaced OpenRouter and Perplexity Sonar with Groq Compound for live web search
- Settings now accept a Groq API key and store it under a provider-specific browser key
- Added a clear free-tier rate-limit error when Groq returns HTTP 429

## [1.0.0] — 2026-05-28

### Added
- Live web search powered by `perplexity/sonar` via OpenRouter
- Auto-expansion of short queries (country names, topics) into full search strings
- Current date + time injected into every request for accurate news retrieval
- Conversation history with automatic cap at 10 exchanges to prevent context overflow
- Dark theme UI with welcome screen and suggestion buttons
- Settings modal — OpenRouter key stored in `localStorage`
- Browser-only API key entry through Settings, without build-time key embedding

### Changed
- Replaced AgentRouter + Claude with OpenRouter + Perplexity (live web search)
- Replaced RSS feed fetching (rss2json / allorigins) with direct AI web search
- Removed `useFeed`, `fetchFeeds`, `findRelevant`, `outlets.js`, `FeedStatus` — no longer needed

### Fixed
- Silent empty bubble when API returns no content — now throws a visible error
- Unbounded `apiHistory` growth — capped at 20 messages
- `null` answer being pushed into conversation history
- Arrow keys not working in chat window — added `tabIndex` to scrollable div
- Dead `SourcePills` import removed from `Message.jsx`
