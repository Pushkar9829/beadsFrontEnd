import { useNavigate } from 'react-router-dom';
import { useCustomizerStore } from '../../store/customizerStore';

const STEPS = [
  { n: 1, label: 'Purpose' },
  { n: 2, label: 'Intention' },
  { n: 3, label: 'Birth' },
  { n: 4, label: 'Zodiac' },
  { n: 5, label: 'Charm' },
  { n: 6, label: 'Review' },
];

const LAYER_STEPS = [
  { n: 5, label: 'Charm' },
  { n: 6, label: 'Review' },
];

export default function Stepper() {
  const navigate = useNavigate();
  const step = useCustomizerStore((s) => s.step);
  const setStep = useCustomizerStore((s) => s.setStep);
  const layer = useCustomizerStore((s) => s.layer);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const calibration = useCustomizerStore((s) => s.calibration);
  const charm = useCustomizerStore((s) => s.charm);
  const picked = (recommended || []).some((b) => (quantities[b._id] || 0) > 0);
  const steps = layer ? LAYER_STEPS : STEPS;

  const can = (n) => {
    if (layer) {
      if (n === 5) return true;
      if (n === 6) return !!charm;
      return false;
    }
    if (n <= step) return true;
    if (n === 2) return !!purpose;
    if (n === 3) return !!intention && picked;
    if (n === 4) return !!calibration;
    if (n === 5) return !!calibration;
    if (n === 6) return !!charm && !!calibration;
    return false;
  };

  return (
    <ol className="studio-steps no-scrollbar">
      {steps.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        const allowed = can(s.n);
        return (
          <li key={s.n} className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              disabled={!allowed}
              onClick={() => {
                if (!allowed) return;
                if (layer && s.n < 5 && layer.path) {
                  navigate(layer.path);
                  return;
                }
                setStep(s.n);
              }}
              className={`studio-chip ${active ? 'is-on' : done ? 'is-done' : ''}`}
            >
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && <span className="studio-chip-rule" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
