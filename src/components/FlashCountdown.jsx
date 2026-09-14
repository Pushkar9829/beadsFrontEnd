import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FlashSaleMark from './ui/FlashSaleMark';

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

export default function FlashCountdown({ sale, to = '/sale', compact = false }) {
  const [t, setT] = useState(() => (sale?.endsAt ? parts(sale.endsAt) : null));
  useEffect(() => {
    if (!sale?.endsAt) return undefined;
    const id = setInterval(() => setT(parts(sale.endsAt)), 1000);
    return () => clearInterval(id);
  }, [sale?.endsAt]);
  if (!sale || !t) return null;
  const inner = (
    <div className={`flash-timer${compact ? ' flash-timer-inline' : ''}`}>
      {!compact && (
        <FlashSaleMark size="md" label="Flash sale" name={sale.name} />
      )}
      <p className="flash-timer-clock">
        {t.d}d {t.h}h {t.m}m {t.s}s
      </p>
      {to && <p className="flash-timer-cta">Shop the sale →</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}
