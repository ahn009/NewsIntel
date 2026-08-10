# NewsIntel

A React chat app that searches the live web for current news using Groq Compound Mini. No RSS feeds or CORS proxies — ask a question and get real-time news with cited sources.

## How It Works

1. User types a question or picks a suggestion
2. Short inputs, like `"pakistan"` or `"ai"`, auto-expand into detailed search queries
3. The request includes fresh global timezone context
4. `groq/compound-mini` performs a bounded web search and answers with cited sources
5. The completed briefing appears with markdown, source attribution, and a Key Takeaway

## Features

- Live web search on every question
- Abortable Groq requests with Stop and Regenerate controls
- Sidebar with local chat history stored in the browser
- Polished responsive chat UI
- Groq key entered in Settings and stored locally in the user's browser
- No build-time API key embedding

## Tech Stack

- React 18 + Vite 8
- Groq API (`groq/compound-mini` system)
- No external runtime libraries beyond React

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Groq API key from [console.groq.com/keys](https://console.groq.com/keys)

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), then paste your Groq key in Settings.

The dev and preview servers bind to `127.0.0.1` by default. Do not expose Vite dev server to a public network.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
src/
  components/
    ChatWindow.jsx
    InputBar.jsx
    Message.jsx
    Sidebar.jsx
    Toast.jsx
  hooks/
    useChat.js
  utils/
    groqClient.js
  App.jsx
  App.css
```

## Security Notes

- Do not put real API keys in `.env`, source files, or deployment environment variables for this frontend.
- This is a browser-only BYOK app: the user's Groq key is stored in `localStorage` and used directly from their browser.
- For a public multi-user production service, add a backend proxy, keep provider keys server-side, add rate limiting/auth, and do not expose provider credentials to the client.
- If a real key was ever committed, pasted into chat, or present in shared logs, revoke and rotate it immediately.

## Scripts

```bash
npm run dev       # Local development server on 127.0.0.1
npm run build     # Production build
npm run preview   # Local production preview on 127.0.0.1
```

## License

MIT
