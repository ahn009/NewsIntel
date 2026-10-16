import { CATEGORIES } from '../hooks/useNews.js';

export default function Sidebar({ sidebarOpen, activeCategory, onSelectCategory, closeSidebar }) {
  function handleSelect(id) {
    onSelectCategory(id);
    if (window.innerWidth <= 768) closeSidebar?.();
  }

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📡</span>
          <span className="sidebar-logo-text">NewsIntel</span>
        </div>
      </div>

      <nav className="sidebar-history">
        <p className="history-label">Sections</p>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`nav-btn ${cat.id === activeCategory ? 'active' : ''}`}
            onClick={() => handleSelect(cat.id)}
            type="button"
          >
            <span className="nav-icon">{cat.icon}</span>
            <span className="nav-label">{cat.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <p className="sidebar-note">
          🤖 Fully automated — scraped &amp; summarized hourly. No AI, no API keys.
        </p>
        <p className="sidebar-version">NewsIntel v2.0 · Auto Briefings</p>
      </div>
    </aside>
  );
}
