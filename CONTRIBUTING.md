# Contributing to NewsIntel

## Getting Started

```bash
git clone https://github.com/ahn009/newsintel.git
cd newsintel
npm install
npm run dev
```

## Making Changes

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Verify the build passes: `npm run build`
4. Commit with a clear message
5. Open a pull request

## Project Structure

```
src/
  components/     UI components (ChatWindow, InputBar, Message)
  hooks/          useChat — chat state and API calls
  utils/          groqClient — Groq client, query expansion, date injection
  App.jsx         App shell and settings modal
  App.css         Dark theme styles
```

## Key Files

| File | What to know |
|---|---|
| `src/utils/groqClient.js` | All AI logic lives here — model, prompt, query expansion |
| `src/hooks/useChat.js` | Message state and conversation history management |
| `src/components/Message.jsx` | Renders markdown-like bold/italic in responses |

## Guidelines

- No new dependencies without a strong reason — the app is intentionally zero-dependency beyond React
- Keep `apiHistory` capped (currently 20 messages) to avoid context overflow
- Never commit `.env` or real API keys
- `VITE_` prefix exposes variables to the browser bundle — don't put secrets there in production

## Reporting Bugs

Open a GitHub issue using the Bug Report template.

## License

By contributing you agree your changes are licensed under the project's [MIT License](./LICENSE).
