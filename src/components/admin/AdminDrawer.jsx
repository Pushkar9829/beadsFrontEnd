import { X } from 'lucide-react';

export default function AdminDrawer({ open, title, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <aside className={`relative z-10 flex h-full w-full flex-col border-l border-[rgba(198,167,94,0.3)] bg-surface ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <h2 className="font-serif text-xl gold-text">{title}</h2>
          <button type="button" onClick={onClose} className="text-lilac hover:text-ivory">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
