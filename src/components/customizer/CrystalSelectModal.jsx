import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCustomizerStore } from '../../store/customizerStore';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';
import Button from '../ui/Button';

export default function CrystalSelectModal({ open, onClose, onComplete }) {
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const toggleBead = useCustomizerStore((s) => s.toggleBead);
  const selectingIntention = useCustomizerStore((s) => s.selectingIntention);
  const stepError = useCustomizerStore((s) => s.stepError);
  const pickedCount = recommended.filter((b) => (quantities[b._id] || 0) > 0).length;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] grid place-items-end p-0 sm:place-items-center sm:p-6">
      <button
        type="button"
        aria-label="Close crystal selection"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        onClick={onClose}
      />
      <div className="studio-modal animate-overlay" role="dialog" aria-modal="true" aria-labelledby="crystal-modal-title">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Crystals</p>
            <h2 id="crystal-modal-title" className="font-serif text-xl gold-text">
              {intention?.name || 'Intention'}
            </h2>
            <p className="mt-1 text-sm text-lilac">
              All of these start selected. Tap a stone to keep or release it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lilac transition hover:bg-gold/10 hover:text-ivory"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {selectingIntention && (
            <p className="py-8 text-center text-sm text-lilac">Selecting crystals…</p>
          )}

          {stepError && <p className="mb-4 text-sm text-red-300">{stepError}</p>}

          {!selectingIntention && recommended.length === 0 && !stepError && (
            <p className="py-8 text-center text-sm text-lilac">No crystals are mapped to this intention yet.</p>
          )}

          {!selectingIntention && recommended.length > 0 && (
            <div className="grid gap-3">
              {recommended.map((bead) => {
                const on = (quantities[bead._id] || 0) > 0;
                return (
                  <button
                    key={bead._id}
                    type="button"
                    onClick={() => toggleBead(bead._id)}
                    className={`studio-bead ${on ? 'is-on' : 'is-off'}`}
                  >
                    <GemVisual
                      color={bead.colorHex}
                      image={bead.image}
                      name={bead.name}
                      className="h-16 w-16 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-lg leading-tight">{bead.name}</p>
                        <span className={`mt-1 text-[10px] uppercase tracking-widest ${on ? 'text-gold' : 'text-lilac'}`}>
                          {on ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-lilac">{bead.shortDescriptor}</p>
                      <p className="mt-1.5 text-xs text-gold">
                        <Price value={bead.pricePerBead} /> / bead
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[rgba(198,167,94,0.2)] px-5 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-lilac">
            {pickedCount} selected
          </p>
          <Button onClick={onComplete || onClose} disabled={selectingIntention || pickedCount < 1}>
            {pickedCount < 1 ? 'Keep one crystal' : 'Use these crystals'}
          </Button>
        </div>
      </div>
    </div>
  );
}
