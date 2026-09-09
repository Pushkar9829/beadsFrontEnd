import { useEffect, useRef, useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';
import StrandReorder from './StrandReorder';

function clampQty(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(4, Math.round(v));
}

export default function ZodiacStep() {
  const calibration = useCustomizerStore((s) => s.calibration);
  const config = useCustomizerStore((s) => s.config);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const reorderLayout = useCustomizerStore((s) => s.reorderLayout);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const [qty, setQty] = useState(
    clampQty(calibration?.zodiacQty || config?.zodiacBeadCount || 2)
  );
  const [busy, setBusy] = useState(false);
  const startedFor = useRef('');
  const zodiac = calibration?.zodiac;
  const bead = zodiac?.bead;
  const layout = calibration?.layout || [];

  useEffect(() => {
    const key = calibration?.dateOfBirth || '';
    if (!calibration || zodiacAdded) return;
    if (startedFor.current === key) return;
    startedFor.current = key;
    const count = clampQty(qty);
    setBusy(true);
    addZodiacBeads(count)
      .catch(() => {
        startedFor.current = '';
      })
      .finally(() => setBusy(false));
  }, [calibration, zodiacAdded, addZodiacBeads]);

  async function apply(n) {
    const count = clampQty(n);
    setQty(count);
    setBusy(true);
    try {
      await addZodiacBeads(count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-birth">
      <p className="studio-birth-kicker">
        {zodiac?.sign || 'Sign pending'}
        {zodiac?.dateRange ? ` · ${zodiac.dateRange}` : ''}
      </p>

      {bead ? (
        <div className="studio-zodiac-card">
          <GemVisual
            color={bead.colorHex}
            image={bead.image}
            name={bead.name}
            className="studio-zodiac-gem"
          />
          <div className="min-w-0">
            <p className="studio-bead-name">{bead.name}</p>
            <p className="studio-bead-price">
              <Price value={bead.pricePerBead} /> / bead
            </p>
          </div>
        </div>
      ) : (
        <p className="studio-birth-note">Zodiac beads are placed from your sign’s stone.</p>
      )}

      <div>
        <p className="studio-birth-kicker">Count</p>
        <div className="studio-qty studio-qty-sm">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => apply(n)}
              disabled={busy}
              className={`studio-qty-btn ${qty === n ? 'is-on' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {busy && <p className="studio-birth-note">Updating…</p>}

      {layout.length > 0 && (
        <StrandReorder layout={layout} onMove={reorderLayout} />
      )}
    </div>
  );
}
