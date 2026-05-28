# NewsIntel

NewsIntel is a React and Vite web app that turns live RSS headlines into a chat-based news analyst. It fetches recent articles from major international and Pakistani news outlets, finds the articles most relevant to a user question, and asks Claude through AgentRouter to answer using only those article snippets.

## Features

- Chat-style interface for asking questions about current news
- RSS feed collection from 26 news outlets
- Automatic feed refresh every 30 minutes
- Local article relevance matching before sending context to the AI model
- Source labels on answers so users can see which outlets were used
- Settings modal for adding an AgentRouter API key and base URL in the browser
- Responsive Vite frontend built with React

## Tech Stack

- React 18
- Vite 5
- AgentRouter API
- Claude model endpoint through AgentRouter
- RSS to JSON feed parsing through `api.rss2json.com`

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- AgentRouter API key

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then update the values:

```env
VITE_AR_KEY=sk-your-agentrouter-key-here
VITE_AR_BASE_URL=https://agentrouter.org/v1
```

You can also leave `.env` empty and add the API key from the in-app Settings modal. Settings are stored in browser `localStorage`.

### Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How It Works

1. `useFeed` loads RSS feeds from the outlets listed in `src/constants/outlets.js`.
2. `fetchFeeds` converts RSS feeds into recent article objects and keeps articles from the last 24 hours.
3. `findRelevantArticles` selects the most relevant articles for the user question.
4. `useChat` sends the question, relevant articles, and conversation history to `askClaude`.
5. `claudeClient` calls AgentRouter and asks Claude to answer only from the provided articles.

## Project Structure

```text
src/
  components/       Reusable UI components
  constants/        RSS outlet list
  hooks/            Feed and chat state logic
  utils/            Feed fetching, relevance matching, and AI API client
  App.jsx           Main app shell
  App.css           App styling
```

## API Key Note

This is a browser-only Vite app. Any value prefixed with `VITE_` is included in the client bundle at build time. Do not use this approach for a production app with private keys. For production, route AI requests through a backend service and keep the AgentRouter key on the server.

## Scripts

```bash
npm run dev       # Start local development server
npm run build     # Build static production files
npm run preview   # Preview the production build locally
```

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
