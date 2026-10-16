export default function SearchBar({ query, onChange, resultCount }) {
  return (
    <div className="search-wrap">
      <span className="search-icon">⌕</span>
      <input
        className="search-input"
        type="search"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Search stories, topics, sources…"
        aria-label="Search news"
      />
      {query && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          type="button"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      {query && (
        <span className="search-count">
          {resultCount} result{resultCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
