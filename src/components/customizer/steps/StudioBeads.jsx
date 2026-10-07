// "Beads" step for the non-purpose paths: the strand, adjusted until it matches the strand
// length. Planetary and profession strands also carry the customer's zodiac crystal, so this
// step asks for the date of birth and adds that crystal once it is in.
import { useEffect, useRef } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { dateRangeLabel, zodiacFromDate } from '../../../lib/calibration';
import DateFields from '../DateFields';
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
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const recommended = useCustomizerStore((s) => s.recommended);
  const zodiacBeadCount = useCustomizerStore((s) => s.config?.zodiacBeadCount);
  const seededFor = useRef('');
  const seeds = path === 'planetary' || path === 'profession';

  // Add the zodiac crystal once per date of birth (a new date re-places it).
  useEffect(() => {
    if (!seeds || !dateOfBirth || zodiacAdded || calibrating) return;
    if (seededFor.current === dateOfBirth) return;
    seededFor.current = dateOfBirth;
    addZodiacBeads(calibration?.zodiacQty || zodiacBeadCount || 2).catch(() => {});
  }, [seeds, dateOfBirth, zodiacAdded, calibrating, calibration, zodiacBeadCount, addZodiacBeads]);

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
  const waiting = seeds && Boolean(dateOfBirth) && (!zodiacAdded || calibrating);

  return (
    <div className="nx-birth">
      {seeds && (
        <section className="nx-birth-date">
          <div className="nx-birth-date-c">
            <p className="nx-eb">Your zodiac crystal</p>
            <p className="nx-birth-hint">
              {signName && signBead
                ? `${signName} (${signRange}) · ${signBead} joins the strand.`
                : 'Enter your date of birth and the crystal for your sign joins the strand.'}
            </p>
          </div>
          <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
        </section>
      )}
      {path === 'zodiac' && signName && (
        <div className="nx-chosen">
          <span className="nx-chosen-c">
            <span className="nx-eb">Zodiac</span>
            <span className="nx-chosen-h">{signName}</span>
            <span className="nx-birth-hint">{[signRange, layerItem?.theme].filter(Boolean).join(' · ')}</span>
          </span>
        </div>
      )}
      <StrandList rows={recommended} busy={waiting} roleLabels={{ intention: CORE_LABEL[path], 'intention-primary': CORE_LABEL[path] }} />
    </div>
  );
}
