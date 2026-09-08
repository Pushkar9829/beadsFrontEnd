import { useCustomizerStore } from '../../store/customizerStore';
import Card from '../ui/Card';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';

export default function IntentionGrid() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const selected = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const selectIntention = useCustomizerStore((s) => s.selectIntention);
  const toggleBead = useCustomizerStore((s) => s.toggleBead);
  const selectingIntention = useCustomizerStore((s) => s.selectingIntention);
  const stepError = useCustomizerStore((s) => s.stepError);
  const picked = recommended.filter((b) => (quantities[b._id] || 0) > 0);

  return (
    <div>
      <h2 className="font-serif text-2xl gold-text">Choose an intention</h2>
      <p className="mt-2 text-sm text-lilac">
        For <span className="text-gold">{purpose?.name}</span>. Click an intention — its crystals are selected for you. Tap a crystal to include or exclude it, then Next.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {intentions.map((it) => (
          <button
            key={it._id}
            type="button"
            disabled={selectingIntention}
            onClick={() => selectIntention(it)}
            className={`rounded-2xl bg-surface p-4 text-left gold-border ${
              selected?._id === it._id ? 'ring-2 ring-amethyst-light' : 'hover:border-gold/70'
            }`}
          >
            <h3 className="font-serif text-lg">{it.name}</h3>
            <p className="mt-1 text-sm text-lilac">{it.description}</p>
            {selected?._id === it._id && (
              <p className="mt-2 text-[11px] uppercase tracking-widest text-gold">
                {selectingIntention ? 'Selecting crystals…' : `${picked.length} crystal${picked.length === 1 ? '' : 's'} selected`}
              </p>
            )}
          </button>
        ))}
      </div>

      {selectingIntention && (
        <p className="mt-6 text-sm text-lilac">Loading crystals for this intention…</p>
      )}

      {stepError && <p className="mt-4 text-sm text-red-300">{stepError}</p>}

      {selected && !selectingIntention && recommended.length > 0 && (
        <div className="mt-10">
          <h3 className="font-serif text-xl gold-text">Selected crystals</h3>
          <p className="mt-1 text-sm text-lilac">
            All of these start selected. Click one to drop it from the strand.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommended.map((bead) => {
              const on = (quantities[bead._id] || 0) > 0;
              return (
                <button
                  key={bead._id}
                  type="button"
                  onClick={() => toggleBead(bead._id)}
                  className={`flex gap-3 rounded-2xl bg-surface p-3 text-left gold-border ${
                    on ? 'ring-2 ring-gold' : 'opacity-50'
                  }`}
                >
                  <GemVisual
                    color={bead.colorHex}
                    image={bead.image}
                    name={bead.name}
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-lg">{bead.name}</p>
                      <span className={`mt-1 text-[10px] uppercase tracking-widest ${on ? 'text-gold' : 'text-lilac'}`}>
                        {on ? 'Selected' : 'Off'}
                      </span>
                    </div>
                    <p className="text-xs text-lilac">{bead.shortDescriptor}</p>
                    <p className="mt-1 text-xs text-gold"><Price value={bead.pricePerBead} /> / bead</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
