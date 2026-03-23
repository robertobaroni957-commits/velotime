import { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    const newToast = { id, type, message };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const showSuccess = (message) => addToast('success', message);
  const showError = (message) => addToast('error', message);
  const showInfo = (message) => addToast('info', message);

  const value = {
    toasts,
    showSuccess,
    showError,
    showInfo,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
