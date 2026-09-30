import { useState } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import CrystalSelectModal from '../CrystalSelectModal';

export default function CrystalGate() {
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const strandCount = useCustomizerStore((s) => s.strandCount);
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
      <p className="text-sm text-lilac">
        Select the stones, then set the strand to 16, 18, or 22 beads.
      </p>
      {picked.length ? (
        <button type="button" className="studio-chosen mt-6" onClick={() => setOpen(true)}>
          <span className="studio-chosen-copy">
            <strong>{picked.length} crystals</strong>
            <em>{total} of {strandCount || 18} beads</em>
          </span>
          <span>Edit</span>
        </button>
      ) : (
        <button type="button" className="studio-chosen mt-6" onClick={() => setOpen(true)}>
          <span className="studio-chosen-copy">
            <strong>Choose crystals</strong>
          </span>
          <span>Open</span>
        </button>
      )}
      <CrystalSelectModal open={open} onClose={() => setOpen(false)} onComplete={onComplete} />
    </div>
  );
}
