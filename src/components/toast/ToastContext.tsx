import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
  preserveOnAction?: boolean; // if true, don't auto-dismiss immediately after action
}

interface ToastInternal extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  push: (toast: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

const VARIANT_STYLES: Record<string, { border: string; bg: string; accent: string }> = {
  info: { border: '1px solid var(--border-primary)', bg: 'var(--bg-tertiary)', accent: '#58a6ff' },
  success: { border: '1px solid rgba(0, 211, 149, 0.4)', bg: 'rgba(0, 211, 149, 0.12)', accent: '#00d395' },
  warning: { border: '1px solid rgba(255, 159, 67, 0.4)', bg: 'rgba(255, 159, 67, 0.12)', accent: '#ff9f43' },
  error: { border: '1px solid rgba(255, 107, 107, 0.4)', bg: 'rgba(255, 107, 107, 0.12)', accent: '#ff6b6b' }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((toast: ToastOptions) => {
    const id = toast.id || Math.random().toString(36).slice(2);
    const t: ToastInternal = {
      id,
      title: toast.title,
      description: toast.description,
      variant: toast.variant || 'info',
      duration: toast.duration ?? 4500,
      actionLabel: toast.actionLabel,
      onAction: toast.onAction,
      preserveOnAction: toast.preserveOnAction,
      createdAt: Date.now()
    };
    setToasts((prev) => {
      // If a toast with the same id exists, replace it (prevents duplicates like repeated status messages)
      const existingIndex = prev.findIndex(p => p.id === id);
      if (existingIndex !== -1) {
        const clone = [...prev];
        clone[existingIndex] = t;
        return clone;
      }
      return [...prev, t];
    });

    if (t.duration && t.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.some(x => x.id === id && x.createdAt === t.createdAt)
          ? prev.filter(x => x.id !== id)
          : prev);
      }, t.duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '360px',
          pointerEvents: 'none'
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const variant = VARIANT_STYLES[t.variant || 'info'];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                role="status"
                style={{
                  background: variant.bg,
                  border: variant.border,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem 0.9rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  pointerEvents: 'auto',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '4px',
                  background: variant.accent,
                  borderTopLeftRadius: 'inherit',
                  borderBottomLeftRadius: 'inherit'
                }} />
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4
                  }}
                >
                  <X size={14} />
                </button>
                {t.title && (
                  <div style={{ fontWeight: 600, marginBottom: t.description ? 4 : (t.actionLabel ? 6 : 0), color: variant.accent }}>
                    {t.title}
                  </div>
                )}
                {t.description && (
                  <div style={{ opacity: 0.9, marginBottom: t.actionLabel ? 6 : 0 }}>{t.description}</div>
                )}
                {t.actionLabel && t.onAction && (
                  <button
                    onClick={() => {
                      t.onAction && t.onAction();
                      if (!t.preserveOnAction) dismiss(t.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: variant.accent,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                    aria-label={t.actionLabel}
                  >
                    {t.actionLabel}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
