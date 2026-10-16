import { useState } from 'react';
import { timeAgo } from '../hooks/useNews.js';

export default function StoryCard({ story, onToast }) {
  const [copied, setCopied] = useState(false);
  const summary = Array.isArray(story.summary) ? story.summary : [];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(story.url || '');
      setCopied(true);
      onToast?.('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast?.('Could not copy link');
    }
  }

  return (
    <article className="story-card">
      <div className="story-top">
        <span className="badge-cat">{story.category || 'news'}</span>
        <span className="story-source">{story.source}</span>
        <span className="story-time">{timeAgo(story.published_at)}</span>
      </div>

      <a
        className="story-title"
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {story.title}
      </a>

      {story.image && (
        <a href={story.url} target="_blank" rel="noopener noreferrer" className="story-thumb-link">
          <img
            className="story-thumb"
            src={story.image}
            alt=""
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </a>
      )}

      <div className="story-summary">
        {summary.map((sentence, i) => (
          <p key={i}>{sentence}</p>
        ))}
      </div>

      <div className="story-actions">
        <a
          className="read-link"
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read full story →
        </a>
        <button className="action-btn" onClick={copyLink} type="button">
          {copied ? '✓ Copied' : '⧉ Copy link'}
        </button>
      </div>

      {story.related && story.related.length > 0 && (
        <div className="related-row">
          <span className="related-label">Also covered by:</span>
          {story.related.map((r, i) => (
            <span key={i}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="related-link">
                {r.source}
              </a>
              {i < story.related.length - 1 && <span className="related-sep"> · </span>}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
