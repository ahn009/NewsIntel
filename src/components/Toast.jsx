import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  function showToast(message, duration = 2000) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }

  return { toasts, showToast };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  );
}
