import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, opts = {}) => {
    const id = crypto.randomUUID?.() ?? Date.now().toString();
    const toast = { id, msg, type: opts.type || "info", ttl: opts.ttl ?? 3500 };
    setToasts(t => [toast, ...t]);
    if (toast.ttl > 0) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, toast.ttl);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow-lg text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
            <div className="flex justify-between items-center gap-2">
              <div>{t.msg}</div>
              <button onClick={() => remove(t.id)} className="ml-2 text-xs opacity-80">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
