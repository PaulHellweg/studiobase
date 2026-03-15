import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

// ─── Accent colours per type ───────────────────────────────────────────────────

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: "rgba(22, 163, 74, 0.12)",
    border: "rgba(22, 163, 74, 0.3)",
    icon: "#16a34a",
    text: "#16a34a",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.3)",
    icon: "#ef4444",
    text: "#ef4444",
  },
  info: {
    bg: "rgba(99, 102, 241, 0.12)",
    border: "rgba(99, 102, 241, 0.3)",
    icon: "#6366f1",
    text: "#6366f1",
  },
};

// ─── Icon SVGs ─────────────────────────────────────────────────────────────────

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
  if (type === "success") {
    return (
      <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Single toast ──────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const styles = TYPE_STYLES[toast.type];

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        backdropFilter: "blur(8px)",
        minWidth: "260px",
        maxWidth: "380px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        animation: "toast-in 0.2s ease-out",
      }}
    >
      <ToastIcon type={toast.type} color={styles.icon} />
      <p
        style={{
          flex: 1,
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#ffffff",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          color: "#666",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
        aria-label="Schließen"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, 4000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          alignItems: "flex-end",
          pointerEvents: toasts.length === 0 ? "none" : "auto",
        }}
      >
        <style>{`
          @keyframes toast-in {
            from { opacity: 0; transform: translateY(8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
