import { useCustomizerStore } from '../../store/customizerStore';
import { STUDIO_FLOW } from '../../lib/studioFlow';

export default function Stepper() {
  const step = useCustomizerStore((s) => s.step);
  const setStep = useCustomizerStore((s) => s.setStep);
  const canReachStep = useCustomizerStore((s) => s.canReachStep);

  return (
    <ol className="studio-steps no-scrollbar">
      {STUDIO_FLOW.map((entry, i) => {
        const n = i + 1;
        const active = step === n;
        const allowed = canReachStep(n);
        return (
          <li key={entry.id} className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              disabled={!allowed}
              onClick={() => allowed && setStep(n)}
              aria-current={active ? 'step' : undefined}
              className={`studio-chip ${active ? 'is-on' : step > n ? 'is-done' : ''}`}
            >
              <span className="studio-chip-n">{n}</span>
              <span>{entry.label}</span>
            </button>
            {i < STUDIO_FLOW.length - 1 && <span className="studio-chip-rule" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
