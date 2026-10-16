import { timeAgo } from '../hooks/useNews.js';

export default function BriefingCard({ story }) {
  return (
    <article className="briefing-card">
      <div className="briefing-rank">#{story.rank}</div>
      <div className="briefing-body">
        <a
          className="briefing-title"
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {story.title}
        </a>
        {story.brief && <p className="briefing-text">{story.brief}</p>}
        <div className="briefing-meta">
          <span className="story-source">{story.source}</span>
          <span className="story-time">{timeAgo(story.published_at)}</span>
          <a
            className="briefing-link"
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full story →
          </a>
        </div>
      </div>
    </article>
  );
}
