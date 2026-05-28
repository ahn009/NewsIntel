import React, { useRef, useState } from 'react';

export default function InputBar({ onSend, onStop, loading }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  function resizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
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
    <div className="input-wrapper">
      <div className="input-box">
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
          placeholder="Message NewsIntel…"
          disabled={loading}
          rows={1}
        />
        {loading ? (
          <button className="stop-btn" onClick={onStop} type="button" aria-label="Stop generation">
            ■
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send"
            type="button"
          >
            ↑
          </button>
        )}
      </div>
      <div className="input-footer">
        Enter to send · Shift+Enter for new line · {text.length > 0 ? `${text.length} chars` : 'Live web search'}
      </div>
    </div>
  );
}
