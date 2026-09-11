import { useEffect, useState } from 'react';
import { subscribeToasts } from '../../lib/adminToast';

export default function AdminToast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return subscribeToasts((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    });
  }, []);

  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${
            t.type === 'error' ? 'border-red-400/40 bg-red-950 text-red-100' : 'border-gold/40 bg-surface text-ivory'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
