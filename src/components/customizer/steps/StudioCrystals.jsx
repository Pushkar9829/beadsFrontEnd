// Crystals step for the non-purpose paths: opens the crystal popup straight away and keeps a
// summary bar to reopen it.
import { useState } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import CrystalModal from '../CrystalModal';

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
      <div className="sb-ihead">
        <span className="sb-ihead-p">Select the stones, then set the strand to 16, 18 or 22 beads.</span>
      </div>
      <div className="sb-box sb-sum">
        <div>
          <div className="sb-ck">{layer?.name || 'Crystals'}</div>
          <div className="sb-sum-v">
            {picked.length ? `${picked.length} ${picked.length === 1 ? 'crystal' : 'crystals'} · ${total} of ${strandCount || 18} beads` : 'Choose your crystals'}
          </div>
        </div>
        <div className="sb-sum-a">
          <button type="button" className="sb-btn-ghost" onClick={() => setOpen(true)}>
            {picked.length ? 'Edit crystals' : 'Open'}
          </button>
        </div>
      </div>
      <CrystalModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} />
    </div>
  );
}
