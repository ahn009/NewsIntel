import { useState, useCallback } from 'react';
import { askClaude } from '../utils/claudeClient.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiHistory, setApiHistory] = useState([]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || loading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
    }]);
    setLoading(true);

    try {
      const answer = await askClaude(userText, apiHistory);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: answer,
      }]);

      setApiHistory(prev => {
        const next = [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: answer },
        ];
        // Keep last 20 messages (10 exchanges) to avoid context overflow
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });

    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        error: err.message === 'NO_KEY'
          ? 'No API key. Click ⚙ Settings and paste your OpenRouter key.'
          : `Error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, apiHistory]);

  function clearChat() {
    setMessages([]);
    setApiHistory([]);
  }

  return { messages, loading, sendMessage, clearChat };
}
