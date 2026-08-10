import { useState, useCallback, useRef } from 'react';
import { askGroq } from '../utils/groqClient.js';

const HISTORY_LIMIT = 20;

function trimHistory(history) {
  return history.length > HISTORY_LIMIT ? history.slice(history.length - HISTORY_LIMIT) : history;
}

function messagesToApiHistory(messages) {
  return trimHistory(
    messages
      .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.text && !msg.error)
      .map(msg => ({ role: msg.role, content: msg.text }))
  );
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiHistory, setApiHistory] = useState([]);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (userText, historyOverride = apiHistory) => {
    const cleanText = userText.trim();
    if (!cleanText || loading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: cleanText,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    const assistantId = `${Date.now()}-assistant`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      text: '',
      streaming: true,
    }]);

    abortRef.current = new AbortController();

    try {
      const answer = await askGroq(
        cleanText,
        historyOverride,
        (_token, fullText) => {
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, text: fullText, streaming: true }
              : msg
          ));
        },
        abortRef.current.signal
      );

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, text: answer, streaming: false }
          : msg
      ));

      setApiHistory(prev => trimHistory([
        ...prev,
        { role: 'user', content: cleanText },
        { role: 'assistant', content: answer },
      ]));

    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, streaming: false }
            : msg
        ));
        return;
      }

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              text: '',
              streaming: false,
              error: err.message === 'NO_KEY'
                ? 'No API key. Click ⚙ Settings and paste your Groq key.'
                : err.message === 'INVALID_KEY'
                  ? 'That Groq API key is invalid or expired. Update it in ⚙ Settings.'
                : `Error: ${err.message}`,
            }
          : msg
      ));
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [loading, apiHistory]);

  const regenerate = useCallback(async () => {
    if (loading) return;

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    const nextHistory = apiHistory.slice(0, -2);
    setApiHistory(nextHistory);

    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant');
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.slice(0, realIdx);
    });

    await sendMessage(lastUserMsg.text, nextHistory);
  }, [apiHistory, loading, messages, sendMessage]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setMessages(prev => prev.map(msg =>
      msg.streaming ? { ...msg, streaming: false } : msg
    ));
  }, []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setApiHistory([]);
    setLoading(false);
  }, []);

  const loadMessages = useCallback((nextMessages = []) => {
    abortRef.current?.abort();
    const normalized = nextMessages.map((msg, index) => ({
      ...msg,
      id: msg.id || `${Date.now()}-${index}`,
      streaming: false,
    }));
    setMessages(normalized);
    setApiHistory(messagesToApiHistory(normalized));
    setLoading(false);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    regenerate,
    stop,
    clearChat,
    loadMessages,
  };
}
