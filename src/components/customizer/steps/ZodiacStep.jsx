import { useEffect, useRef } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { zodiacFromDate } from '../../../lib/calibration';
import GemVisual from '../../ui/GemVisual';
import QtyControl from '../../ui/QtyControl';
import Spinner from '../../ui/Spinner';

const ROLE_LABEL = {
  'intention-primary': 'Intention',
  intention: 'Intention',
  zodiac: 'Zodiac',
};

export default function ZodiacStep() {
  const calibration = useCustomizerStore((s) => s.calibration);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const setBeadQty = useCustomizerStore((s) => s.setBeadQty);
  const path = useCustomizerStore((s) => s.path);
  const offerZodiacBead = useCustomizerStore((s) => s.offerZodiacBead);
  const seeded = useRef(false);
  const target = [16, 18, 22].includes(Number(strandCount)) ? Number(strandCount) : 18;
  const total = (recommended || []).reduce((sum, bead) => sum + qtyOf(quantities, bead._id), 0);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const zodiac = calibration?.zodiac;
  let signName = zodiac?.sign;
  if (!signName && dateOfBirth) {
    try {
      signName = zodiacFromDate(dateOfBirth).sign;
    } catch {
      signName = '';
    }
  }

  useEffect(() => {
    if (path === 'purpose') {
      offerZodiacBead();
      return;
    }
    if (seeded.current || !calibration || zodiacAdded || calibrating) return;
    seeded.current = true;
    addZodiacBeads(calibration.zodiacQty || 2);
  }, [path, calibration, zodiacAdded, calibrating, addZodiacBeads, offerZodiacBead]);

  if (path !== 'purpose' && (!calibration || calibrating)) return <Spinner label="Placing the beads" />;
  if (path === 'purpose' && calibrating) return <Spinner label="Placing the beads" />;

  return (
    <div className="studio-birth">
      <p className="studio-birth-kicker">{path === 'purpose' ? `Beads for ${signName || 'your sign'}` : (signName || 'Zodiac')}</p>
      <p className="mt-2 text-sm text-lilac">
        {zodiac?.dateRange || 'From your date of birth'}
        {zodiac?.bead?.name ? ` · ${zodiac.bead.name}` : ''}
      </p>
      <p className={`studio-birth-note mt-4 ${total === target ? '' : 'is-error'}`}>
        {total} of {target} beads
        {total === target ? '. The strand matches.' : '. Select, deselect, or change a count until they match.'}
      </p>

      <div className="studio-crystal-list mt-5">
        {recommended.map((bead) => {
          const qty = qtyOf(quantities, bead._id);
          const on = qty > 0;
          const role = (bead.roles || []).map((key) => ROLE_LABEL[key] || key).filter(Boolean).join(' · ');
          return (
            <div key={bead._id} className={`studio-crystal studio-crystal-line ${on ? 'is-on' : ''}`}>
              <button
                type="button"
                className="studio-bead-box"
                aria-pressed={on}
                onClick={() => setBeadQty(bead._id, on ? 0 : 1)}
              >
                {on ? 'On' : 'Off'}
              </button>
              <GemVisual
                color={bead.colorHex}
                image={bead.image}
                name={bead.name}
                className="studio-crystal-gem"
              />
              <div className="studio-crystal-copy">
                <p className="studio-bead-name">{bead.name}</p>
                {role ? <p className="studio-bead-price">{role}</p> : null}
              </div>
              <QtyControl
                value={qty}
                min={0}
                max={on ? qty + Math.max(0, target - total) : 0}
                onChange={(n) => setBeadQty(bead._id, n)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
