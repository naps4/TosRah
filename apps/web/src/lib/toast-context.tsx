import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
  action?: { label: string; onClick: () => void };
};
type ToastFn = (
  message: string,
  type?: Toast['type'],
  action?: Toast['action'],
) => void;

const ToastContext = createContext<ToastFn | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback<ToastFn>((message, type = 'success', action) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type, action }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      action ? 4500 : 2800,
    );
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.type === 'success' ? 'bg-leaf-700' : 'bg-chili'
            }`}
          >
            <span aria-hidden>{t.type === 'success' ? '✓' : '!'}</span>
            <span>{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  setToasts((x) => x.filter((y) => y.id !== t.id));
                }}
                className="ml-2 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}