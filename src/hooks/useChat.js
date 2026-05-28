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

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      text: '',
      streaming: true,
    }]);

    try {
      const answer = await askClaude(userText, apiHistory, (_token, fullText) => {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, text: fullText, streaming: true }
            : msg
        ));
      });

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, text: answer, streaming: false }
          : msg
      ));

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
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              text: '',
              streaming: false,
              error: err.message === 'NO_KEY'
                ? 'No API key. Click ⚙ Settings and paste your OpenRouter key.'
                : `Error: ${err.message}`,
            }
          : msg
      ));
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
