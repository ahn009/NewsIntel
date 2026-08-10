import React, { useEffect, useRef, useState } from 'react';
import Message from './Message.jsx';

export default function ChatWindow({ messages, loading, suggestions, onSuggestion, onRegenerate, onToast }) {
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
      <div className="chat-window welcome-screen" ref={containerRef}>
        <div className="welcome-inner">
          <div className="welcome-logo">📡</div>
          <h1 className="welcome-title">How can NewsIntel help?</h1>
          <p className="welcome-sub">
            Live web search powered by Groq Compound Mini. Ask about any country, topic, or event — get concise, sourced news briefings in seconds.
          </p>
          <div className="suggestions-grid">
            {suggestions.map((s, i) => (
              <button key={i} className="suggestion-btn" onClick={() => onSuggestion(s)} type="button">
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
          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="thinking-row">
              <div className="avatar">NI</div>
              <div className="thinking-label">
                Searching the live web
                <span className="dots"><span /><span /><span /></span>
              </div>
            </div>
          )}
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
