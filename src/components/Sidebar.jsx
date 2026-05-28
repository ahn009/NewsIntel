export default function Sidebar({
  sidebarOpen,
  chatHistory,
  activeChatId,
  startNewChat,
  loadChat,
  setShowSettings,
  onDeleteChat,
  onClearAll,
}) {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📡</span>
          <span className="sidebar-logo-text">NewsIntel</span>
        </div>
        <button className="new-chat-btn" onClick={startNewChat} type="button">
          <span>✏</span>
          <span>New Chat</span>
        </button>
      </div>

      <div className="sidebar-history">
        <p className="history-label">Recent</p>
        {chatHistory.map(chat => (
          <div
            key={chat.id}
            className={`history-row ${chat.id === activeChatId ? 'active' : ''}`}
          >
            <button
              className="history-btn"
              onClick={() => loadChat(chat.id)}
              type="button"
            >
              <span className="history-title">{chat.title}</span>
              <span className="history-time">{timeAgo(chat.timestamp)}</span>
            </button>

            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              title="Delete"
              type="button"
            >
              🗑
            </button>
          </div>
        ))}
        {chatHistory.length === 0 && (
          <p className="history-empty">No previous chats</p>
        )}
        {chatHistory.length > 0 && (
          <button className="clear-all-btn" onClick={onClearAll} type="button">
            Clear all
          </button>
        )}
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-settings-btn" onClick={() => setShowSettings(true)} type="button">
          ⚙ Settings
        </button>
        <p className="sidebar-version">NewsIntel v1.0 · Live Search</p>
      </div>
    </aside>
  );
}

function timeAgo(timestamp) {
  const diff = Date.now() - Number(timestamp || 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
