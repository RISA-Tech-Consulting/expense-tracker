import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'danger' | 'warning';
  onUndo?: () => void;
}

let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null;

export function showToast(text: string, type: ToastMessage['type'] = 'success', onUndo?: () => void) {
  addToastFn?.({ text, type, onUndo });
}

let nextId = 1;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (msg) => {
      const id = nextId++;
      setToasts(prev => [...prev, { ...msg, id }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };
    return () => { addToastFn = null; };
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast show mb-2 border-0 bg-${t.type} bg-opacity-10`} role="alert">
          <div className="toast-body d-flex align-items-center justify-content-between gap-2">
            <span className="small">{t.text}</span>
            <div className="d-flex gap-2 flex-shrink-0">
              {t.onUndo && (
                <button
                  className="btn btn-sm btn-outline-primary py-0 px-2"
                  onClick={() => { t.onUndo?.(); dismiss(t.id); }}
                >
                  Undo
                </button>
              )}
              <button className="btn-close btn-close-sm" onClick={() => dismiss(t.id)} aria-label="Close" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
