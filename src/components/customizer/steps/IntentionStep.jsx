import { useState } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { intentionEmoji } from '../../../lib/studioIcons';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../PurposeGrid';
import CrystalSelectModal from '../CrystalSelectModal';

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
      <p className="text-sm text-lilac">
        For <span className="text-gold">{purpose?.name}</span>. One intention opens its crystals.
      </p>
      <div className="purpose-pick mt-4">
        {intentions.map((it) => {
          const on = String(intention?._id) === String(it._id);
          return (
            <button
              key={it._id}
              type="button"
              disabled={selecting}
              onClick={() => onPick(it)}
              className={`purpose-pick-card disabled:opacity-60 ${on ? 'is-on' : ''}`}
              style={purposeToneStyle(it)}
            >
              <span className={`purpose-pick-emoji ${purposeHasImage(it) ? 'is-image' : 'is-plain'}`} aria-hidden>
                {purposeHasImage(it) ? <PurposeIcon purpose={it} /> : intentionEmoji(it)}
              </span>
              <span className="purpose-pick-copy">
                <h3>{it.name}</h3>
                <p>{it.description || (it.braceletName ? `Bracelet: ${it.braceletName}` : '')}</p>
              </span>
            </button>
          );
        })}
      </div>

      {intention && picked.length ? (
        <button type="button" className="studio-chosen mt-6" onClick={() => setOpen(true)}>
          <span className="studio-chosen-copy">
            <strong>{picked.length} crystals</strong>
            <em>{strandCount} beads</em>
          </span>
          <span>Edit</span>
        </button>
      ) : null}

      <CrystalSelectModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} />
    </div>
  );
}
