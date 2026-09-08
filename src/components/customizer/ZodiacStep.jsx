import { useEffect, useRef, useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import Button from '../ui/Button';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';

function clampQty(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(4, Math.round(v));
}

export default function ZodiacStep() {
  const calibration = useCustomizerStore((s) => s.calibration);
  const config = useCustomizerStore((s) => s.config);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const setStep = useCustomizerStore((s) => s.setStep);
  const [qty, setQty] = useState(
    clampQty(calibration?.zodiacQty || config?.zodiacBeadCount || 2)
  );
  const [busy, setBusy] = useState(false);
  const startedFor = useRef('');
  const zodiac = calibration?.zodiac;
  const bead = zodiac?.bead;

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

  async function applyAndContinue() {
    const count = clampQty(qty);
    setQty(count);
    setBusy(true);
    try {
      await addZodiacBeads(count);
      setStep(5);
    } catch {
      if (useCustomizerStore.getState().zodiacAdded) setStep(5);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
        {zodiac?.sign || 'Sign pending'}
        {zodiac?.dateRange ? ` · ${zodiac.dateRange}` : ''}
      </p>

      {bead ? (
        <article className="auth-card mt-5 flex gap-4">
          <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="h-24 w-24 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <h3 className="font-serif text-xl gold-text">{bead.name}</h3>
            <p className="mt-1 text-sm text-lilac">{bead.shortDescriptor}</p>
            <p className="mt-3 text-sm leading-relaxed text-ivory/80">{zodiac.reason}</p>
            <p className="mt-3 text-sm text-gold">
              <Price value={bead.pricePerBead} /> <span className="text-lilac">/ bead</span>
            </p>
          </div>
        </article>
      ) : (
        <p className="mt-6 text-sm text-lilac">Zodiac beads will be placed from your sign’s stone.</p>
      )}

      <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-gold">Beads to add</p>
      <div className="studio-qty mt-3">
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

      <div className="mt-5 pb-2">
        <Button type="button" onClick={applyAndContinue} disabled={busy}>
          {busy ? 'Updating…' : 'Update zodiac beads'}
        </Button>
      </div>

      {zodiacAdded && !busy && (
        <p className="mt-4 text-sm text-gold">Zodiac beads are on the strand. Continue to name the piece.</p>
      )}
    </div>
  );
}
