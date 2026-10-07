import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../PurposeGrid';
import { useStudioLabels } from '../../../lib/studioTheme';

// Step 1 of the purpose path: one tile per purpose. The purpose's tone tints only the
// artwork well, so the grid stays calm while each tile keeps its own colour.
export default function PurposePick() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const selecting = useCustomizerStore((s) => s.selecting);
  const labels = useStudioLabels();

  if (!purposes.length) {
    return <p className="nx-lede">{labels.emptyPurposes || 'Purposes will appear here once the studio is configured.'}</p>;
  }

  return (
    <div className="nx-ptiles" role="radiogroup" aria-label="Purpose">
      {purposes.map((p, i) => {
        const on = String(selected?._id) === String(p._id);
        return (
          <button
            key={p._id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={selecting}
            onClick={() => selectPurpose(p)}
            className={`nx-ptile${on ? ' is-on' : ''}`}
            style={purposeToneStyle(p)}
          >
            <span className="nx-ptile-n">{String(i + 1).padStart(2, '0')}</span>
            {on && (
              <span className="nx-ptile-check" aria-hidden>
                <Check size={13} strokeWidth={2.4} />
              </span>
            )}
            <span className={`nx-ptile-art${purposeHasImage(p) ? '' : ' is-glyph'}`} aria-hidden>
              <PurposeIcon purpose={p} />
            </span>
            <span className="nx-ptile-h">{p.name}</span>
            {p.description && <span className="nx-ptile-p">{p.description}</span>}
          </button>
        );
      })}
    </div>
  );
}
