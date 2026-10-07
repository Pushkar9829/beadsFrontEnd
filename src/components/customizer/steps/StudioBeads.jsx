// "Beads" step for the layer paths: the strand after calibration, adjusted until it matches
// the strand length. Planetary and profession strands get their zodiac beads added once the
// calibration is in, exactly as the original ZodiacStep did.
import { useEffect, useRef } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { dateRangeLabel, zodiacFromDate } from '../../../lib/calibration';
import StrandList from '../StrandList';

// On these paths the core stones come from the chosen sign, planet or profession.
const CORE_LABEL = { zodiac: 'Sign', planetary: 'Planet', profession: 'Profession', numerology: 'Number' };

export default function StudioBeads() {
  const path = useCustomizerStore((s) => s.path);
  const calibration = useCustomizerStore((s) => s.calibration);
  const zodiacAdded = useCustomizerStore((s) => s.zodiacAdded);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const addZodiacBeads = useCustomizerStore((s) => s.addZodiacBeads);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const recommended = useCustomizerStore((s) => s.recommended);
  const seeded = useRef(false);
  const seeds = path !== 'numerology' && path !== 'zodiac';

  useEffect(() => {
    if (!seeds) return;
    if (seeded.current || !calibration || zodiacAdded || calibrating) return;
    seeded.current = true;
    addZodiacBeads(calibration.zodiacQty || 2);
  }, [seeds, calibration, zodiacAdded, calibrating, addZodiacBeads]);

  let sign = null;
  try {
    sign = dateOfBirth ? zodiacFromDate(dateOfBirth) : null;
  } catch {
    sign = null;
  }
  const zodiac = calibration?.zodiac;
  const signName = path === 'zodiac' ? layerItem?.name : zodiac?.sign || sign?.sign;
  const signRange = path === 'zodiac' ? layerItem?.dates : zodiac?.dateRange || (sign ? dateRangeLabel(sign) : '');
  const signBead = zodiac?.bead?.name || sign?.beadName;
  const waiting = seeds && (!calibration || calibrating);

  return (
    <div className="nx-birth">
      {path !== 'numerology' && signName && (
        <div className="nx-chosen">
          <span className="nx-chosen-c">
            <span className="nx-eb">Zodiac</span>
            <span className="nx-chosen-h">{signName}</span>
            <span className="nx-birth-hint">
              {[signRange, seeds && signBead ? `${signBead} joins the strand` : '', path === 'zodiac' ? layerItem?.theme : ''].filter(Boolean).join(' · ')}
            </span>
          </span>
        </div>
      )}
      <StrandList rows={recommended} busy={waiting} roleLabels={{ intention: CORE_LABEL[path], 'intention-primary': CORE_LABEL[path] }} />
    </div>
  );
}
