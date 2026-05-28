import React, { useState } from 'react';

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('');

  function handleSend() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="input-bar">
      <input
        className="chat-input"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ask about any news topic, country, or event…"
        disabled={disabled}
      />
      <button
        className={`send-btn${disabled ? ' disabled' : ''}`}
        onClick={handleSend}
        disabled={disabled}
        aria-label="Send"
      >
        {disabled ? '…' : '↑'}
      </button>
    </div>
  );
}
