import { useEffect, useMemo, useState } from 'react';
import { useChat } from './hooks/useChat.js';
import { useToast, ToastContainer } from './components/Toast.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import InputBar from './components/InputBar.jsx';
import './App.css';

const HISTORY_KEY = 'ni_chat_history';

function getInitialSidebarState() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > 768;
}

function loadStoredHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function generateTitle(text) {
  const title = text
    .replace(/^(what|tell me|show me|give me|how|why|when|is|are|any)\s+/i, '')
    .replace(/\?$/, '')
    .trim()
    .slice(0, 38);

  return title || 'New chat';
}

function createTitle(messages) {
  const firstUser = messages.find(msg => msg.role === 'user');
  return generateTitle(firstUser?.text || '');
}

export default function App() {
  const { messages, loading, sendMessage, regenerate, stop, clearChat, loadMessages } = useChat();
  const { toasts, showToast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
  const [chatHistory, setChatHistory] = useState(loadStoredHistory);
  const [activeChatId, setActiveChatId] = useState(null);

  const hasKey = !!localStorage.getItem('ni_or_key');

  const suggestions = useMemo(() => [
    '🌍 What are the top world stories right now?',
    '🇵🇰 What is happening in Pakistan today?',
    '🤖 Latest AI and technology news',
    '📈 Global economy and markets today',
    '🏛 Major political developments today',
    '⚔️ Any conflicts or crises in the news?',
  ], []);

  useEffect(() => {
    if (chatHistory.length === 0) {
      localStorage.removeItem(HISTORY_KEY);
      return;
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (!messages.some(msg => msg.role === 'user')) return;

    const timestamp = Date.now();
    setChatHistory(prev => {
      const existingId = activeChatId || `chat-${timestamp}`;
      const entry = {
        id: existingId,
        title: createTitle(messages),
        timestamp,
        messages: messages.map(msg => ({ ...msg, streaming: false })),
      };

      const next = [entry, ...prev.filter(chat => chat.id !== existingId)].slice(0, 30);
      if (!activeChatId) setActiveChatId(existingId);
      return next;
    });
  }, [messages, activeChatId]);

  function saveKey() {
    if (keyInput.trim()) {
      localStorage.setItem('ni_or_key', keyInput.trim());
      setShowSettings(false);
      setKeyInput('');
      window.location.reload();
    }
  }

  function toggleSidebar() {
    setSidebarOpen(prev => !prev);
  }

  function startNewChat() {
    clearChat();
    setActiveChatId(null);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }

  function loadChat(chatId) {
    const chat = chatHistory.find(item => item.id === chatId);
    if (!chat) return;
    loadMessages(chat.messages || []);
    setActiveChatId(chat.id);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }

  function deleteChat(chatId) {
    const updated = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    if (chatId === activeChatId) {
      startNewChat();
    }
  }

  function clearAllChats() {
    setChatHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    startNewChat();
  }

  function handleRegenerate() {
    showToast('Regenerating...');
    regenerate();
  }

  return (
    <div className="app-shell">
      <Sidebar
        sidebarOpen={sidebarOpen}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        startNewChat={startNewChat}
        loadChat={loadChat}
        setShowSettings={setShowSettings}
        onDeleteChat={deleteChat}
        onClearAll={clearAllChats}
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
              Perplexity Sonar · Live
            </div>
            <div className="header-title">NewsIntel</div>
          </div>
          <div className="header-right">
            <button className="icon-btn" onClick={clearChat} title="Clear chat" type="button">🗑</button>
            <button className="icon-btn" onClick={startNewChat} title="New chat" type="button">✏</button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings" type="button">⚙</button>
          </div>
        </header>

        <main className="chat-area">
          <ChatWindow
            messages={messages}
            loading={loading}
            suggestions={suggestions}
            onSuggestion={sendMessage}
            onRegenerate={handleRegenerate}
            onToast={showToast}
            hasKey={hasKey}
          />
        </main>

        <div className="input-area">
          <InputBar
            onSend={sendMessage}
            onStop={stop}
            loading={loading}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} />

      {(showSettings || !hasKey) && (
        <div className="modal-overlay" onClick={() => hasKey && setShowSettings(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚙ OpenRouter API Key</h3>
            <p className="modal-label">Paste your key below</p>
            <input
              className="modal-input"
              type="password"
              placeholder="Paste your OpenRouter API key"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              autoFocus
            />
            <p className="modal-hint">
              Free key at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">
                openrouter.ai/keys
              </a>
              {' '}— no credit card needed
            </p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={saveKey} type="button">Save & Start</button>
              {hasKey && (
                <button className="btn-ghost" onClick={() => setShowSettings(false)} type="button">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
