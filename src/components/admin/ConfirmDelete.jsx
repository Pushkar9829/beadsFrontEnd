import Button from '../ui/Button';

export default function ConfirmDelete({ open, title = 'Delete record', body, onConfirm, onClose, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 gold-border">
        <h2 className="font-serif text-xl gold-text">{title}</h2>
        <p className="mt-3 text-sm text-lilac">{body || 'This cannot be undone.'}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex rounded-full bg-red-900/80 px-5 py-2.5 text-xs uppercase tracking-widest text-red-100 hover:bg-red-800"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
