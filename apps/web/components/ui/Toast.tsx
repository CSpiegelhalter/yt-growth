"use client";

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to show toast notifications
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op if used outside provider (graceful fallback)
    return { toast: () => {} };
  }
  return context;
}

/**
 * Toast Provider - wrap your app with this
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
      <style jsx global>{`
        .toast-container {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }
        @media (min-width: 640px) {
          .toast-container {
            left: auto;
            right: 24px;
            bottom: 24px;
            max-width: 360px;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 2.5s
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgColor = {
    success: "var(--success)",
    error: "var(--danger)",
    info: "var(--info)",
  }[toast.type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: bgColor,
        color: "white",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        fontWeight: 500,
        boxShadow: "var(--shadow-lg)",
        pointerEvents: "auto",
        transform: visible && !leaving ? "translateY(0)" : "translateY(20px)",
        opacity: visible && !leaving ? 1 : 0,
        transition: "all 0.2s ease",
      }}
    >
      <span>{toast.message}</span>
    </div>
  );
}

/**
 * Standalone copy function with inline feedback
 * Use this when you don't need the toast provider
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

