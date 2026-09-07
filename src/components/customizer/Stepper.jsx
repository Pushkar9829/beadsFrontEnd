import { useCustomizerStore } from '../../store/customizerStore';

const STEPS = [
  { n: 1, label: 'Purpose' },
  { n: 2, label: 'Intention' },
  { n: 3, label: 'Crystals / Beads' },
  { n: 4, label: 'Charm' },
  { n: 5, label: 'Review & Order' },
];

export default function Stepper() {
  const step = useCustomizerStore((s) => s.step);
  const setStep = useCustomizerStore((s) => s.setStep);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);

  const can = (n) => {
    if (n === 1) return true;
    if (n === 2) return !!purpose;
    if (n >= 3) return !!intention;
    return false;
  };

  return (
    <ol className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {STEPS.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <li key={s.n} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!can(s.n)}
              onClick={() => can(s.n) && setStep(s.n)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest ${
                active
                  ? 'bg-amethyst text-ivory'
                  : done
                    ? 'border border-gold/50 text-gold'
                    : 'border border-white/10 text-lilac'
              }`}
            >
              <span className="font-serif">{s.n}</span> {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="hidden text-gold/40 sm:inline">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
