import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { subscribeToasts } from '../../lib/adminToast';
import { cx } from './primitives';

// Consumes the existing `toast(message, type)` API from lib/adminToast, so it works everywhere.
export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((prev) => [...prev.filter((p) => p.message !== t.message), t].slice(-4));
        setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== t.id)), t.type === 'error' ? 6500 : 3500);
      }),
    []
  );
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,22rem)] flex-col gap-2" aria-live="polite">
      {items.map((t) => {
        const Icon = t.type === 'error' ? XCircle : t.type === 'info' ? Info : CheckCircle2;
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-raised px-3.5 py-3 text-sm shadow-2xl',
              t.type === 'error' ? 'border-rose-400/30' : 'border-white/10'
            )}
          >
            <Icon size={16} className={cx('mt-0.5 shrink-0', t.type === 'error' ? 'text-rose-300' : t.type === 'info' ? 'text-sky-300' : 'text-emerald-300')} />
            <p className="min-w-0 flex-1 text-ivory">{t.message}</p>
            <button type="button" aria-label="Dismiss" className="text-lilac hover:text-ivory" onClick={() => setItems((prev) => prev.filter((p) => p.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
