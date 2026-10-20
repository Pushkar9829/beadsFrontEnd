import { useState } from 'react';
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { PurposeIcon } from '../PurposeGrid';
import CrystalModal from '../CrystalModal';

// Older seed descriptions end with "Design name: X." — the bracelet name is shown on its own line.
function cleanDescription(it) {
  const text = String(it.description || '').trim();
  return it.braceletName ? text.replace(/\s*Design name:.*$/i, '').trim() : text;
}

// Step 2 of the purpose path, beeds_ecommerce StudioBuilderPage.jsx "STEP 2: CHOOSE AN INTENTION"
// (L760-947): purpose banner, intention cards (4 columns) and the summary box.
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
        <div className="sb-box sb-banner">
          <div className="sb-banner-l">
            <span className="sb-banner-art" aria-hidden>
              <PurposeIcon purpose={purpose} />
            </span>
            <div>
              <div className="sb-ck">Your purpose</div>
              <div className="sb-banner-t">{purpose.name}</div>
            </div>
          </div>
          <button type="button" className="sb-link" onClick={() => setStep(1)}>
            Change
          </button>
        </div>
      )}

      <div className="sb-ihead">
        <span className="sb-ihead-p">Choose one intention. Its crystals open next, and you can turn any of them off.</span>
        <span className="sb-ihead-n">
          {intentions.length} {intentions.length === 1 ? 'intention' : 'intentions'}
        </span>
      </div>

      <div className="sb-icards" role="radiogroup" aria-label="Intention">
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
              className={`sb-icard${on ? ' is-on' : ''}`}
            >
              {on && (
                <span className="sb-check" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <span className="sb-icard-n">{String(i + 1).padStart(2, '0')}</span>
              <span className={`sb-icard-t${it.braceletName ? ' has-badge' : ''}`}>{it.name}</span>
              {it.braceletName && <span className="sb-icard-b">{it.braceletName}</span>}
              {desc && <span className="sb-icard-p">{desc}</span>}
              <span className="sb-icard-go">
                <span>{on ? 'Edit crystals' : 'See crystals'}</span>
                <span>→</span>
              </span>
            </button>
          );
        })}
      </div>

      {intention && picked.length ? (
        <div className="sb-box sb-sum">
          <div>
            <div className="sb-ck">{intention.name}</div>
            <div className="sb-sum-v">
              {picked.length} {picked.length === 1 ? 'crystal' : 'crystals'} · {strandCount} beads
            </div>
          </div>
          <div className="sb-sum-a">
            <button type="button" className="sb-btn-ghost" onClick={() => setOpen(true)}>
              Edit crystals
            </button>
            <button type="button" className="sb-btn-gold" onClick={() => goNext()}>
              Continue →
            </button>
          </div>
        </div>
      ) : null}

      <CrystalModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} />
    </div>
  );
}
