// Crystals step for the layer paths: opens the crystal popup straight away and keeps a
// summary bar to reopen it. Same flow as the original CrystalGate.
import { useState } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import NCrystalModal from '../NCrystalModal';

export default function StudioCrystals() {
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const layer = useCustomizerStore((s) => s.layer);
  const goNext = useCustomizerStore((s) => s.goNext);
  const [open, setOpen] = useState(true);
  const picked = recommended.filter((bead) => qtyOf(quantities, bead._id) > 0);
  const total = picked.reduce((sum, bead) => sum + qtyOf(quantities, bead._id), 0);

  async function onComplete() {
    setOpen(false);
    await goNext();
  }

  return (
    <div>
      <p className="nx-pick-head">Select the stones, then set the strand to 16, 18 or 22 beads.</p>
      <button type="button" className="nx-crystal-sum" onClick={() => setOpen(true)}>
        <span>
          <span className="nx-eb">{layer?.name || 'Crystals'}</span>
          <span className="nx-crystal-sum-h">
            {picked.length ? `${picked.length} ${picked.length === 1 ? 'crystal' : 'crystals'} · ${total} of ${strandCount || 18} beads` : 'Choose your crystals'}
          </span>
        </span>
        <span className="nx-chosen-edit">{picked.length ? 'Edit' : 'Open'}</span>
      </button>
      <NCrystalModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} />
    </div>
  );
}
