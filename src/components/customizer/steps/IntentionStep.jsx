import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { PurposeIcon } from '../PurposeGrid';
import CrystalSelectModal from '../CrystalSelectModal';

// Older seed descriptions end with "Design name: X." — the bracelet name is shown on its own line.
function cleanDescription(it) {
  const text = String(it.description || '').trim();
  return it.braceletName ? text.replace(/\s*Design name:.*$/i, '').trim() : text;
}

// Step 2 of the purpose path. Intentions share their purpose's artwork, so the cards are
// text-led; the artwork appears once, on the chosen-purpose strip above them.
export default function IntentionStep() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const selectIntention = useCustomizerStore((s) => s.selectIntention);
  const selecting = useCustomizerStore((s) => s.selecting);
  const goNext = useCustomizerStore((s) => s.goNext);
  const setStep = useCustomizerStore((s) => s.setStep);
  const [open, setOpen] = useState(false);
  const picked = recommended.filter((bead) => qtyOf(quantities, bead._id) > 0);

  async function onPick(it) {
    setOpen(true);
    await selectIntention(it);
  }

  async function onComplete() {
    setOpen(false);
    await goNext();
  }

  return (
    <div>
      {purpose && (
        <div className="nx-chosen">
          <span className="nx-chosen-art" aria-hidden>
            <PurposeIcon purpose={purpose} />
          </span>
          <span className="nx-chosen-c">
            <span className="nx-eb">Your purpose</span>
            <span className="nx-chosen-h">{purpose.name}</span>
          </span>
          <button type="button" className="nx-chosen-edit" onClick={() => setStep(1)}>
            Change
          </button>
        </div>
      )}

      <div className="nx-pick-head">
        <p>Choose one intention. Its crystals open next, and you can turn any of them off.</p>
        <span>
          {intentions.length} {intentions.length === 1 ? 'intention' : 'intentions'}
        </span>
      </div>

      <div className="nx-itiles" role="radiogroup" aria-label="Intention">
        {intentions.map((it, i) => {
          const on = String(intention?._id) === String(it._id);
          const desc = cleanDescription(it);
          return (
            <button
              key={it._id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={selecting}
              onClick={() => onPick(it)}
              className={`nx-itile${on ? ' is-on' : ''}`}
            >
              <span className="nx-itile-top">
                <span className="nx-itile-n">{String(i + 1).padStart(2, '0')}</span>
                {on && (
                  <span className="nx-ptile-check" aria-hidden>
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                )}
              </span>
              <span className="nx-itile-h">{it.name}</span>
              {it.braceletName && <span className="nx-itile-b">{it.braceletName}</span>}
              {desc && <span className="nx-itile-p">{desc}</span>}
              <span className="nx-itile-go">
                {on ? 'Edit crystals' : 'See crystals'} <ArrowRight size={13} strokeWidth={1.6} />
              </span>
            </button>
          );
        })}
      </div>

      {intention && picked.length ? (
        <button type="button" className="nx-crystal-sum" onClick={() => setOpen(true)}>
          <span>
            <span className="nx-eb">{intention.name}</span>
            <span className="nx-crystal-sum-h">
              {picked.length} {picked.length === 1 ? 'crystal' : 'crystals'} · {strandCount} beads
            </span>
          </span>
          <span className="nx-chosen-edit">Edit</span>
        </button>
      ) : null}

      <CrystalSelectModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} tone={false} />
    </div>
  );
}
