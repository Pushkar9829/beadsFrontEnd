// 5-step horizontal stepper bar (beeds_ecommerce StudioBuilderPage.jsx L451-500).
import { useCustomizerStore } from '../../store/customizerStore';
import { flowFor } from '../../lib/studioFlow';

export default function Stepper() {
  const step = useCustomizerStore((s) => s.step);
  const path = useCustomizerStore((s) => s.path);
  const setStep = useCustomizerStore((s) => s.setStep);
  const canReachStep = useCustomizerStore((s) => s.canReachStep);
  const flow = flowFor(path);

  return (
    <div className="sb-steps">
      {flow.map((entry, i) => {
        const n = i + 1;
        const active = step === n;
        const allowed = canReachStep(n);
        return (
          <button
            key={entry.id}
            type="button"
            disabled={!allowed}
            onClick={() => allowed && setStep(n)}
            aria-current={active ? 'step' : undefined}
            className={`sb-step${active ? ' is-on' : step > n ? ' is-done' : ''}`}
          >
            <span className="sb-step-n">{n}</span>
            <span>{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}
