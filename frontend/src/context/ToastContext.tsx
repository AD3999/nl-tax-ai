import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastType = "error" | "success" | "warn" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  error:   "✕",
  success: "✓",
  warn:    "!",
  info:    "i",
};

// Visible text prefixes for screen readers (F10 — "Fout:", "Let op:")
const SR_LABELS: Record<ToastType, string> = {
  error:   "Fout:",
  success: "Klaar:",
  warn:    "Let op:",
  info:    "Info:",
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  error:   { bg: "var(--danger-soft)",  border: "var(--danger)",  icon: "var(--danger)",  text: "var(--ink)" },
  success: { bg: "var(--ok-soft)",      border: "var(--ok)",      icon: "var(--ok)",      text: "var(--ink)" },
  warn:    { bg: "var(--warn-soft)",    border: "var(--warn)",    icon: "oklch(0.45 0.15 75)", text: "var(--ink)" },
  info:    { bg: "var(--info-soft)",    border: "var(--info)",    icon: "var(--info)",    text: "var(--ink)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right, stacks upward */}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 10,
        maxWidth: 380,
        pointerEvents: "none",
      }}>
        {toasts.map(toast => {
          const c = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              aria-atomic="true"
              style={{
                pointerEvents: "all",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "var(--r)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                boxShadow: "var(--shadow-lg)",
                animation: "fadeIn .2s ease-out both",
                maxWidth: 380,
              }}
            >
              {/* Icon badge */}
              <span style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 999,
                background: c.icon,
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 700,
                marginTop: 1,
              }}>
                {ICONS[toast.type]}
              </span>

              {/* Message — prefixed with visible label for screen readers (F10) */}
              <span style={{ flex: 1, fontSize: 13.5, color: c.text, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, marginInlineEnd: 4 }}>{SR_LABELS[toast.type]}</span>
                {toast.message}
              </span>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--ink-4)",
                  fontSize: 16,
                  lineHeight: 1,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
