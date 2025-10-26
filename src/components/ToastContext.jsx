import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

// Hook para usar el toast desde cualquier componente
export function useToast() {
  return useContext(ToastContext);
}

// Provider global que envuelve la app
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Mostrar un toast
  const showToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Eliminarlo después de 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* contenedor de los toasts */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastBubble key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Componente visual de cada toast
function ToastBubble({ message, type }) {
  const base =
    "min-w-[200px] max-w-[260px] rounded-lg px-4 py-3 text-sm shadow-xl border backdrop-blur bg-white/90 flex items-start gap-2";

  const stylesByType = {
    success: "border-green-300 text-green-800 bg-green-50/90",
    error: "border-red-300 text-red-800 bg-red-50/90",
    info: "border-blue-300 text-blue-800 bg-blue-50/90",
  };

  const iconByType = {
    success: "✅",
    error: "⚠️",
    info: "ℹ️",
  };

  return (
    <div className={`${base} ${stylesByType[type] || stylesByType.info}`}>
      <span className="text-lg leading-none">{iconByType[type] || "ℹ️"}</span>
      <span className="leading-snug">{message}</span>
    </div>
  );
}
