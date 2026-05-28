import { useState } from 'react';
import { useChat } from './hooks/useChat.js';
import ChatWindow from './components/ChatWindow.jsx';
import InputBar from './components/InputBar.jsx';
import './App.css';

export default function App() {
  const { messages, loading, sendMessage, clearChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const hasKey = !!(
    import.meta.env.VITE_OR_KEY ||
    localStorage.getItem('ni_or_key')
  );

  function saveKey() {
    if (keyInput.trim()) {
      localStorage.setItem('ni_or_key', keyInput.trim());
      setShowSettings(false);
      setKeyInput('');
      window.location.reload();
    }
  }

  const suggestions = [
    'What are the top news stories right now?',
    'What is happening in Pakistan today?',
    'Latest technology news',
    'Global economy and markets today',
    'Any major political news today?',
    'What conflicts or crises are in the news?',
  ];

  return (
    <div className="app-shell">

      <header className="header">
        <div className="header-left">
          <span className="logo">📡 NewsIntel</span>
          <span className="header-badge">Live Web Search</span>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={clearChat}>🗑</button>
          <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙</button>
        </div>
      </header>

      <main className="chat-area">
        <ChatWindow
          messages={messages}
          loading={loading}
          suggestions={suggestions}
          onSuggestion={sendMessage}
          hasKey={hasKey}
        />
      </main>

      <div className="input-area">
        <InputBar
          onSend={sendMessage}
          disabled={loading}
        />
      </div>

      {(showSettings || !hasKey) && (
        <div className="modal-overlay" onClick={() => hasKey && setShowSettings(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚙ OpenRouter API Key</h3>
            <p className="modal-label">Paste your key below</p>
            <input
              className="modal-input"
              type="password"
              placeholder="sk-or-v1-..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              autoFocus
            />
            <p className="modal-hint">
              Free key at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">
                openrouter.ai/keys
              </a>
              {' '}— no credit card needed
            </p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={saveKey}>Save & Start</button>
              {hasKey && (
                <button className="btn-ghost" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
