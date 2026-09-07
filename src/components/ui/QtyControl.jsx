import { Minus, Plus } from 'lucide-react';

export default function QtyControl({ value = 0, onChange, min = 0, max = 99 }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(198,167,94,0.35)] bg-ink">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center text-gold hover:text-ivory"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-8 text-center text-sm text-ivory">{value}</span>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center text-gold hover:text-ivory disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
