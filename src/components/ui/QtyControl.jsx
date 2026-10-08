import { Minus, Plus } from 'lucide-react';

export default function QtyControl({ value = 0, onChange, min = 0, max = 99 }) {
  return (
    <div className="nx-qty is-s" aria-label="Quantity">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease">
        <Minus size={14} strokeWidth={1.8} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase">
        <Plus size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}
