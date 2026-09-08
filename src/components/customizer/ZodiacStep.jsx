import { useEffect, useRef, useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';

export default function ZodiacStep() {
  const calibration = useCustomizerStore((s) => s.calibration);
  const config = useCustomizerStore((s) => s.config);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const [qty, setQty] = useState(calibration?.zodiacQty || config?.zodiacBeadCount || 2);
  const tried = useRef(false);
  const zodiac = calibration?.zodiac;
  const bead = zodiac?.bead;

  useEffect(() => {
    if (!zodiacAdded) tried.current = false;
  }, [zodiacAdded]);

  useEffect(() => {
    if (!calibration || zodiacAdded || calibrating || tried.current) return;
    tried.current = true;
    addZodiacBeads(qty).catch(() => {
      tried.current = false;
    });
  }, [calibration, zodiacAdded, calibrating, addZodiacBeads, qty]);

  return (
    <div>
      <h2 className="font-serif text-2xl gold-text">Zodiac beads</h2>
      <p className="mt-2 text-sm text-lilac">
        From your date of birth you are <span className="text-gold">{zodiac?.sign || '—'}</span>
        {zodiac?.dateRange ? ` (${zodiac.dateRange})` : ''}. Matching beads are added to the calibrated strand.
      </p>

      {bead ? (
        <Card className="mt-6 flex gap-4 p-4">
          <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="h-24 w-24 rounded-2xl" />
          <div>
            <h3 className="font-serif text-xl">{bead.name}</h3>
            <p className="text-sm text-lilac">{bead.shortDescriptor}</p>
            <p className="mt-2 text-sm text-ivory/80">{zodiac.reason}</p>
            <p className="mt-2 text-gold"><Price value={bead.pricePerBead} /> / bead</p>
          </div>
        </Card>
      ) : (
        <p className="mt-6 text-sm text-lilac">Zodiac beads will be placed from your sign’s stone.</p>
      )}

      <label className="mt-6 block text-xs uppercase tracking-widest text-gold">
        Beads to add
        <select
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <div className="mt-4">
        <Button variant="ghost" onClick={() => addZodiacBeads(qty)} disabled={calibrating}>
          {calibrating ? 'Adding…' : zodiacAdded ? 'Update zodiac beads' : 'Add zodiac beads'}
        </Button>
      </div>

      {zodiacAdded && (
        <p className="mt-4 text-sm text-gold">Zodiac beads are on the strand. Continue to name the piece.</p>
      )}
    </div>
  );
}
