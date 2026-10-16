import StoryCard from './StoryCard.jsx';
import BriefingCard from './BriefingCard.jsx';

export default function NewsFeed({ stories, loading, error, onToast, onRetry, variant }) {
  if (loading) {
    return (
      <div className="feed-state">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="story-card skeleton">
            <div className="sk-line sk-short" />
            <div className="sk-line" />
            <div className="sk-line" />
            <div className="sk-line sk-short" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-state">
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <p className="empty-title">News feed unavailable</p>
          <p className="empty-sub">{error}</p>
          <button className="btn-primary" onClick={onRetry} type="button">Try again</button>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="feed-state">
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <p className="empty-title">No stories found</p>
          <p className="empty-sub">Try a different search or category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed">
      {stories.map(story => (
        variant === 'briefing'
          ? <BriefingCard key={story.id} story={story} />
          : <StoryCard key={story.id} story={story} onToast={onToast} />
      ))}
    </div>
  );
}
