# NewsIntel

A React chat app that searches the live web for current news using Perplexity's online AI model via OpenRouter. No RSS feeds, no CORS proxies — ask a question and get real-time news with cited sources.

## How It Works

1. User types a question or picks a suggestion
2. Short inputs (e.g. `"pakistan"`, `"ai"`) auto-expand into detailed search queries
3. The question goes to OpenRouter with the current date and time injected
4. `perplexity/sonar` searches the live web and answers with cited sources
5. Response renders with bold headlines, source attribution, and a Key Takeaway

## Features

- Live web search on every question — no stale feeds
- Auto-expands short country/topic queries into full search strings
- Conversation history (capped at 10 exchanges to stay within context limits)
- Dark UI with welcome screen and suggestion buttons
- OpenRouter key stored in `localStorage` — entered once via settings modal

## Tech Stack

- React 18 + Vite 5
- OpenRouter API (`perplexity/sonar` model)
- No external libraries beyond React

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Free OpenRouter API key — get one at [openrouter.ai/keys](https://openrouter.ai/keys) (no credit card needed)

### Install

```bash
npm install
```

### Environment

Create `.env` in the project root:

```env
VITE_OR_KEY=sk-or-v1-your-key-here
```

Or leave it empty — the app prompts for the key on first load and saves it to `localStorage`.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/
    ChatWindow.jsx    Welcome screen + message list
    InputBar.jsx      Text input + send button
    Message.jsx       Renders user and assistant bubbles
  hooks/
    useChat.js        Chat state, API calls, history management
  utils/
    claudeClient.js   OpenRouter API client, query expansion, date injection
  App.jsx             App shell, settings modal, key gate
  App.css             Dark theme styles
```

## Security Note

`VITE_OR_KEY` is embedded in the client bundle at build time. For a public deployment, route API calls through a backend and keep the key server-side.

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
```

## License

MIT
