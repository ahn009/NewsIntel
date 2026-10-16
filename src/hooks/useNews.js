import { useCallback, useEffect, useState } from 'react';

export const CATEGORIES = [
  { id: 'top20', label: 'Top 20', file: 'top20.json', icon: '🏆' },
  { id: 'latest', label: 'Latest', file: 'latest.json', icon: '🔥' },
  { id: 'world', label: 'World', file: 'world.json', icon: '🌍' },
  { id: 'pakistan', label: 'Pakistan', file: 'pakistan.json', icon: '🇵🇰' },
  { id: 'tech', label: 'Technology', file: 'tech.json', icon: '🤖' },
  { id: 'business', label: 'Business', file: 'business.json', icon: '📈' },
  { id: 'science', label: 'Science', file: 'science.json', icon: '🔬' },
  { id: 'sports', label: 'Sports', file: 'sports.json', icon: '🏅' },
];

export function useNews(categoryId) {
  const [stories, setStories] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const cat = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/news/${cat.file}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStories(Array.isArray(data.stories) ? data.stories : []);
      setGeneratedAt(data.generated_at || null);
    } catch (err) {
      setError('Could not load news. The hourly scraper may not have run yet — try refreshing in a bit.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stories, generatedAt, loading, error, refresh: load };
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return '';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
