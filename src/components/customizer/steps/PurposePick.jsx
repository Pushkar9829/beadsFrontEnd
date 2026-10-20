import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { PurposeIcon } from '../PurposeGrid';
import { useStudioLabels } from '../../../lib/studioTheme';

// Step 1 of the purpose path: "17 PURPOSE CARDS (EXACT 5 COLUMNS)" in beeds_ecommerce
// StudioBuilderPage.jsx (L637-743).
export function PurposeCard({ purpose, index, on = false, disabled, onClick, as: Tag = 'button', ...rest }) {
  const props = Tag === 'button' ? { type: 'button', role: 'radio', 'aria-checked': on, disabled, onClick } : rest;
  return (
    <Tag className={`sb-card${on ? ' is-on' : ''}`} {...props}>
      {on && (
        <span className="sb-check" aria-hidden>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span className="sb-card-n">{String(index + 1).padStart(2, '0')}</span>
      <span className="sb-card-art" aria-hidden>
        <PurposeIcon purpose={purpose} />
      </span>
      <span className="sb-card-t">{purpose.name}</span>
      {purpose.description && <span className="sb-card-p">{purpose.description}</span>}
    </Tag>
  );
}

export default function PurposePick() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const selecting = useCustomizerStore((s) => s.selecting);
  const labels = useStudioLabels();

  if (!purposes.length) {
    return <p className="sb-empty">{labels.emptyPurposes || 'Purposes will appear here once the studio is configured.'}</p>;
  }

  return (
    <div className="sb-cards" role="radiogroup" aria-label="Purpose">
      {purposes.map((p, i) => (
        <PurposeCard
          key={p._id}
          purpose={p}
          index={i}
          on={String(selected?._id) === String(p._id)}
          disabled={selecting}
          onClick={() => selectPurpose(p)}
        />
      ))}
    </div>
  );
}
