import { useCustomizerStore } from '../../store/customizerStore';

export default function PurposeGrid() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {purposes.map((p, i) => (
        <button
          key={p._id}
          type="button"
          onClick={() => selectPurpose(p)}
          className={`purpose-card group block h-full w-full text-left ${
            selected?._id === p._id ? 'is-on' : ''
          }`}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-gold/80">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-3 font-serif text-xl">{p.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-lilac">{p.description}</p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold opacity-80 transition group-hover:opacity-100">
            {selected?._id === p._id ? 'Selected' : 'Begin →'}
          </p>
        </button>
      ))}
    </div>
  );
}
