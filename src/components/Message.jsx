import React from 'react';

function formatText(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });
    return <p key={i} className="msg-line">{parts}</p>;
  });
}

export default function Message({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="message user-message">
        <div className="bubble user-bubble">{message.text}</div>
      </div>
    );
  }

  return (
    <div className="message assistant-message">
      <div className="avatar">NI</div>
      <div className="assistant-body">
        {message.error ? (
          <div className="bubble error-bubble">{message.error}</div>
        ) : (
          <div className="bubble assistant-bubble">
            {formatText(message.text)}
          </div>
        )}
      </div>
    </div>
  );
}
