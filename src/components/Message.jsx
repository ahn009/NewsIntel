import React, { useState } from 'react';

function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const codeLines = [];
      const key = i;
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key} className="code-block">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="md-h3">{parseInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="md-h2">{parseInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="md-h1">{parseInline(line.slice(2))}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="md-li">
          <span className="md-bullet">·</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      elements.push(
        <div key={i} className="md-li">
          <span className="md-num">{match[1]}.</span>
          <span>{parseInline(match[2])}</span>
        </div>
      );
    } else if (line.toLowerCase().startsWith('**key takeaway')) {
      elements.push(<div key={i} className="takeaway-card">{parseInline(line)}</div>);
    } else if (line.startsWith('Source:')) {
      elements.push(<p key={i} className="md-source">{parseInline(line)}</p>);
    } else if (!line.trim()) {
      elements.push(<div key={i} className="md-gap" />);
    } else {
      elements.push(<p key={i} className="md-p">{parseInline(line)}</p>);
    }
    i++;
  }

  return elements;
}

export default function Message({ message, isLast, loading, onRegenerate, onToast }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const canRegenerate = isLast && !loading && !message.streaming && !message.error;

  async function handleCopy() {
    await navigator.clipboard.writeText(message.text || '');
    setCopied(true);
    onToast?.('Copied!');
    setTimeout(() => setCopied(false), 2000);
  }

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
          <>
            <div className="assistant-bubble">
              {renderMarkdown(message.text)}
              {message.streaming && <span className="cursor-blink" />}
            </div>
            <div className="msg-actions">
              <button
                className={`action-btn${copied ? ' success' : ''}`}
                onClick={handleCopy}
                type="button"
                aria-label="Copy message"
              >
                {copied ? '✓ Copied' : '⧉ Copy'}
              </button>
              {canRegenerate && (
                <button className="action-btn" onClick={onRegenerate} type="button">
                  ↻ Regenerate
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
