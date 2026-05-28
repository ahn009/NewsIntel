import React, { useEffect, useRef } from 'react';
import Message from './Message.jsx';

export default function ChatWindow({ messages, loading, suggestions, onSuggestion, hasKey }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="chat-window welcome-screen">
        <div className="welcome-content">
          <div className="welcome-icon">📡</div>
          <h1 className="welcome-title">NewsIntel</h1>
          <p className="welcome-sub">
            I'm NewsIntel — I search the live web for current news.
            Ask me about any country, topic, or event happening right now.
          </p>
          <div className="suggestions-grid">
            {suggestions.map((s, i) => (
              <button key={i} className="suggestion-btn" onClick={() => onSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" tabIndex={0}>
      <div className="messages-list">
        {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="message assistant-message">
            <div className="avatar">NI</div>
            <div className="bubble thinking-bubble">
              <span className="dot-anim"><span /><span /><span /></span>
              <span className="thinking-label">Searching the web…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
