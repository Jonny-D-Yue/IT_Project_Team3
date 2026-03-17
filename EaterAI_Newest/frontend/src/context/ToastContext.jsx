import { createContext, useState } from "react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  const showToast = ({ title, message, variant = "info", duration = 3200 }) => {
    const id = crypto.randomUUID();

    setToasts((currentToasts) => [
      ...currentToasts,
      { id, title, message, variant },
    ]);

    window.setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
