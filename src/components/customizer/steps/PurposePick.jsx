import { useCustomizerStore } from '../../../store/customizerStore';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../PurposeGrid';
import { useStudioLabels } from '../../../lib/studioTheme';

export default function PurposePick() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const selecting = useCustomizerStore((s) => s.selecting);
  const labels = useStudioLabels();

  return (
    <div className="purpose-pick">
      {purposes.map((p) => (
        <button
          key={p._id}
          type="button"
          disabled={selecting}
          onClick={() => selectPurpose(p)}
          className={`purpose-pick-card disabled:opacity-60 ${String(selected?._id) === String(p._id) ? 'is-on' : ''}`}
          style={purposeToneStyle(p)}
        >
          <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
            <PurposeIcon purpose={p} />
          </span>
          <span className="purpose-pick-copy">
            <h3>{p.name}</h3>
            <p>{p.description}</p>
          </span>
        </button>
      ))}
      {!purposes.length ? (
        <p className="sky-copy text-sm text-lilac">{labels.emptyPurposes}</p>
      ) : null}
    </div>
  );
}
