import React, { useRef, useState } from 'react';

export default function InputBar({ onSend, onStop, loading }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  function resizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }

  function handleInput(e) {
    setText(e.target.value);
    requestAnimationFrame(resizeTextarea);
  }

  function handleSend() {
    const message = text.trim();
    if (!message || loading) return;
    onSend(message);
    setText('');
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  }

  return (
    <div className="input-stack">
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={text}
          onChange={handleInput}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about any news topic, country, or event…"
          disabled={loading}
          rows={1}
        />
        {loading ? (
          <button className="stop-btn" onClick={onStop} type="button">
            ◼ Stop
          </button>
        ) : (
          <button
            className={`send-btn${!text.trim() ? ' disabled' : ''}`}
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send"
            type="button"
          >
            ↑
          </button>
        )}
      </div>
      <div className="input-hint">
        <span>Enter to send · Shift+Enter for new line</span>
        <span style={{ color: text.length > 200 ? 'orange' : 'var(--text-3)' }}>
          {text.length}
        </span>
      </div>
    </div>
  );
}
