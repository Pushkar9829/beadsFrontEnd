import { useCustomizerStore } from '../../store/customizerStore';

export default function PurposeGrid() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);

  return (
    <div>
      <h2 className="font-serif text-2xl gold-text">Choose a purpose</h2>
      <p className="mt-2 max-w-xl text-sm text-lilac">
        Click a purpose to open its intentions. That is the start of Customize.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {purposes.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => selectPurpose(p)}
            className={`rounded-2xl bg-surface p-4 text-left gold-border ${
              selected?._id === p._id ? 'ring-2 ring-amethyst-light' : 'hover:border-gold/70'
            }`}
          >
            <h3 className="font-serif text-lg text-ivory">{p.name}</h3>
            <p className="mt-1 text-sm text-lilac">{p.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
