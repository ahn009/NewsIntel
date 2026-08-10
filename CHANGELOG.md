# Changelog

All notable changes to NewsIntel are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.4] — 2026-08-10

### Fixed
- Switched to `groq/compound-mini` to bound each request to one server-side tool call
- Pinned Compound version `2025-07-23` for smaller basic web-search retrieval
- Reduced API history to one prior exchange and simplified the date prompt to UTC plus user-local time
- Reduced the completion budget to 2,048 tokens and clarified HTTP 413 recovery guidance

## [1.1.3] — 2026-08-10

### Fixed
- Prevented Groq HTTP 413 errors by capping API history at six recent messages and 12,000 total characters
- Truncated individual historical responses at 6,000 characters and limited new questions to 4,000 characters
- Added a specific recovery message if Groq still rejects an oversized conversation

## [1.1.2] — 2026-08-10

### Fixed
- Switched Groq Compound to its reliable completed-response path for built-in web search
- Increased the completion budget from 1,200 to 4,096 tokens so search and reasoning do not consume the full answer budget
- Added specific diagnostics when Groq exhausts the token budget or returns no answer text

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
