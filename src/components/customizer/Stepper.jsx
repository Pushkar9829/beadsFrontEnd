import { useCustomizerStore } from '../../store/customizerStore';

const STEPS = [
  { n: 1, label: 'Purpose' },
  { n: 2, label: 'Intention' },
  { n: 3, label: 'Date of birth' },
  { n: 4, label: 'Zodiac beads' },
  { n: 5, label: 'Name' },
  { n: 6, label: 'Review & Order' },
];

export default function Stepper() {
  const step = useCustomizerStore((s) => s.step);
  const setStep = useCustomizerStore((s) => s.setStep);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const calibration = useCustomizerStore((s) => s.calibration);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const picked = (recommended || []).some((b) => (quantities[b._id] || 0) > 0);

  const can = (n) => {
    if (n === 1) return true;
    if (n === 2) return !!purpose;
    if (n === 3) return !!intention && picked;
    if (n === 4) return !!calibration;
    if (n === 5) return !!zodiacAdded;
    if (n === 6) return engravingName.trim().length >= 2;
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
