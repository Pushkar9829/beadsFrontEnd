import Button from '../ui/Button';

export default function AdminHeader({ title, subtitle, onCreate, createLabel = 'Create' }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl gold-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-lilac">{subtitle}</p>}
      </div>
      {onCreate && <Button onClick={onCreate}>{createLabel}</Button>}
    </div>
  );
}

export function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-2">
      {onEdit && (
        <button type="button" onClick={onEdit} className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10">
          Edit
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="rounded-full border border-red-400/40 px-3 py-1 text-[11px] uppercase tracking-widest text-red-300 hover:bg-red-900/30">
          Delete
        </button>
      )}
    </div>
  );
}

export const fieldClass = 'w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory';
export const labelClass = 'block text-xs uppercase tracking-widest text-gold';
