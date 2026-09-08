import { useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import CrystalSelectModal from './CrystalSelectModal';

export default function IntentionGrid() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const selected = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const selectIntention = useCustomizerStore((s) => s.selectIntention);
  const selectingIntention = useCustomizerStore((s) => s.selectingIntention);
  const stepError = useCustomizerStore((s) => s.stepError);
  const goNext = useCustomizerStore((s) => s.goNext);
  const picked = recommended.filter((b) => (quantities[b._id] || 0) > 0);
  const [crystalOpen, setCrystalOpen] = useState(false);

  async function onPick(it) {
    setCrystalOpen(true);
    if (selected?._id === it._id && recommended.length) return;
    await selectIntention(it);
  }

  async function onComplete() {
    setCrystalOpen(false);
    await goNext();
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
        For {purpose?.name || 'this purpose'}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {intentions.map((it, i) => (
          <button
            key={it._id}
            type="button"
            disabled={selectingIntention}
            onClick={() => onPick(it)}
            className={`purpose-card group block h-full w-full text-left disabled:opacity-60 ${
              selected?._id === it._id ? 'is-on' : ''
            }`}
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-gold/80">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3 font-serif text-xl">{it.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-lilac">{it.description}</p>
            <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold opacity-80">
              {selected?._id === it._id
                ? selectingIntention
                  ? 'Selecting crystals…'
                  : `${picked.length} crystal${picked.length === 1 ? '' : 's'} · Edit`
                : 'Select →'}
            </p>
          </button>
        ))}
      </div>

      {stepError && !crystalOpen && <p className="mt-4 text-sm text-red-300">{stepError}</p>}

      <CrystalSelectModal
        open={crystalOpen}
        onClose={() => setCrystalOpen(false)}
        onComplete={onComplete}
      />
    </div>
  );
}
