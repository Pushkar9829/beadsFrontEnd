import { Minus, Plus } from 'lucide-react';

export default function QtyControl({ value = 0, onChange, min = 0, max = 99 }) {
  return (
    <div className="qty-ctrl">
      <button
        type="button"
        className="qty-ctrl-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <span className="qty-ctrl-val">{value}</span>
      <button
        type="button"
        className="qty-ctrl-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}
