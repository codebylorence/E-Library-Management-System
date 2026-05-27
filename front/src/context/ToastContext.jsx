import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  error:   <XCircle     size={16} className="text-red-400   shrink-0" />,
  warning: <AlertCircle size={16} className="text-yellow-400 shrink-0" />,
  info:    <Info        size={16} className="text-blue-400  shrink-0" />,
};

const BG = {
  success: "bg-gray-800",
  error:   "bg-gray-800",
  warning: "bg-gray-800",
  info:    "bg-gray-800",
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success", duration = 3500) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9998] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 ${BG[t.type]} text-white text-sm px-4 py-3 rounded-xl shadow-xl pointer-events-auto max-w-sm`}
          >
            {ICONS[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/50 hover:text-white transition-colors ml-1 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
};
