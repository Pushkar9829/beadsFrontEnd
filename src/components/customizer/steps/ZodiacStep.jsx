import { useCustomizerStore } from '../../../store/customizerStore';
import Spinner from '../../ui/Spinner';

export default function ZodiacStep() {
  const calibration = useCustomizerStore((s) => s.calibration);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const zodiacQty = useCustomizerStore((s) => s.zodiacQty);
  const config = useCustomizerStore((s) => s.config);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const count = zodiacQty || calibration?.zodiacQty || config?.zodiacBeadCount || 2;
  const zodiac = calibration?.zodiac;
  const bead = zodiac?.bead;

  if (!calibration) return <Spinner label="Waiting for the birth date" />;

  return (
    <div className="studio-birth">
      <p className="studio-birth-kicker">{zodiac?.sign || 'Sign'}</p>
      <p className="mt-2 text-sm text-lilac">
        {zodiac?.dateRange || 'From your date of birth'}
        {bead?.name ? ` · ${bead.name}` : ''}
      </p>
      {zodiac?.reason ? <p className="mt-2 text-sm text-lilac">{zodiac.reason}</p> : null}
      <p className="studio-birth-kicker mt-6">How many</p>
      <div className="studio-qty studio-qty-sm mt-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            disabled={calibrating}
            onClick={() => addZodiacBeads(n)}
            className={`studio-qty-btn ${Number(count) === n ? 'is-on' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      {calibrating ? <p className="studio-birth-note mt-4">Placing zodiac beads…</p> : null}
      {zodiacAdded ? <p className="studio-birth-note mt-4">Zodiac beads are on the strand, either side of the charm.</p> : null}
    </div>
  );
}
