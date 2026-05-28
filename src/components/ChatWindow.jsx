import React, { useEffect, useRef, useState } from 'react';
import Message from './Message.jsx';

export default function ChatWindow({ messages, loading, suggestions, onSuggestion, onRegenerate, onToast, hasKey }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  }

  useEffect(() => {
    if (!showScrollBtn) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, showScrollBtn]);

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
    <div className="chat-window-wrap">
      <div className="chat-window" ref={containerRef} onScroll={handleScroll} tabIndex={0}>
        <div className="messages-list">
          {messages.map((msg, index) => (
            <Message
              key={msg.id}
              message={msg}
              isLast={index === messages.length - 1}
              loading={loading}
              onRegenerate={onRegenerate}
              onToast={onToast}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      {showScrollBtn && (
        <button
          className="scroll-btn"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          type="button"
        >
          ↓ Latest
        </button>
      )}
    </div>
  );
}
