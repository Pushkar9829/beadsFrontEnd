import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function parts(endsAt) {
  const ms = Math.max(0, new Date(endsAt) - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function FlashCountdown({ sale, to = '/sale' }) {
  const [t, setT] = useState(() => (sale?.endsAt ? parts(sale.endsAt) : null));
  useEffect(() => {
    if (!sale?.endsAt) return undefined;
    const id = setInterval(() => setT(parts(sale.endsAt)), 1000);
    return () => clearInterval(id);
  }, [sale?.endsAt]);
  if (!sale || !t) return null;
  const inner = (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{sale.name}</p>
      <p className="mt-1 font-serif text-lg text-ivory">
        {t.d}d {t.h}h {t.m}m {t.s}s
      </p>
      {to && <p className="mt-1 text-[10px] uppercase tracking-widest text-gold">Shop the sale →</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}
