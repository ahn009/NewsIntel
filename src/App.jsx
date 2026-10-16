import { useEffect, useMemo, useState } from 'react';
import { useNews, CATEGORIES, timeAgo } from './hooks/useNews.js';
import { useToast, ToastContainer } from './components/Toast.jsx';
import Sidebar from './components/Sidebar.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import SearchBar from './components/SearchBar.jsx';
import './App.css';

function getInitialSidebarState() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > 768;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
  const [category, setCategory] = useState('top20');
  const [query, setQuery] = useState('');
  const { stories, generatedAt, loading, error, refresh } = useNews(category);
  const { toasts, showToast } = useToast();

  const activeCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const isBriefing = category === 'top20';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter(s => {
      const hay = [
        s.title,
        s.source,
        s.category,
        s.brief || '',
        ...(Array.isArray(s.summary) ? s.summary : []),
      ].join(' ').toLowerCase();
      return q.split(/\s+/).every(word => hay.includes(word));
    });
  }, [stories, query]);

  useEffect(() => {
    setQuery('');
  }, [category]);

  function toggleSidebar() {
    setSidebarOpen(prev => !prev);
  }

  return (
    <div className="app-shell">
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory={category}
        onSelectCategory={setCategory}
        closeSidebar={() => setSidebarOpen(false)}
      />

      {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}

      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar} type="button" aria-label="Toggle sidebar">
              ☰
            </button>
            <div className="model-badge">
              <div className="model-dot" />
              Auto · Updates hourly
            </div>
            <div className="header-title">NewsIntel</div>
          </div>
          <div className="header-right">
            {generatedAt && (
              <span className="updated-label" title={new Date(generatedAt).toLocaleString()}>
                Updated {timeAgo(generatedAt)}
              </span>
            )}
            <button className="icon-btn" onClick={refresh} title="Refresh news" type="button">↻</button>
          </div>
        </header>

        <main className="news-area">
          <div className="news-inner">
            <div className="section-head">
              <h1 className="section-title">
                <span className="section-icon">{activeCat.icon}</span>
                {activeCat.label}
              </h1>
              <p className="section-sub">
                {isBriefing
                  ? 'The 20 biggest stories right now — each summarized in seconds. No long articles.'
                  : `Auto-summarized from ${stories.length} top ${stories.length === 1 ? 'story' : 'stories'} across major outlets. No AI, no sign-up.`}
              </p>
            </div>

            <SearchBar query={query} onChange={setQuery} resultCount={filtered.length} />

            <NewsFeed
              stories={filtered}
              loading={loading}
              error={error}
              onToast={showToast}
              onRetry={refresh}
              variant={isBriefing ? 'briefing' : 'cards'}
            />

            {!loading && !error && filtered.length > 0 && (
              <p className="feed-footer">
                Summaries are auto-extracted from the source article — tap any headline for the full story.
              </p>
            )}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
