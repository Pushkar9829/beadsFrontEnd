// Birth step for the numerology, zodiac, planetary and profession paths: the date and what
// it reads. (The purpose path uses PurposeBirth, which also offers the personal beads.)
import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, dateRangeLabel, mulankFromDate, zodiacFromDate } from '../../../lib/calibration';
import DateFields from '../DateFields';

export default function StudioBirth() {
  const path = useCustomizerStore((s) => s.path);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const showNumbers = path !== 'zodiac';
  const showZodiac = path !== 'numerology';

  let numbers = null;
  try {
    if (dateOfBirth) numbers = { mulank: mulankFromDate(dateOfBirth), bhagyank: bhagyankFromDate(dateOfBirth), sign: zodiacFromDate(dateOfBirth) };
  } catch {
    numbers = null;
  }
  const sign = path === 'zodiac' ? (layerItem ? { name: layerItem.name, sub: layerItem.dates || '' } : null) : numbers ? { name: numbers.sign.sign, sub: dateRangeLabel(numbers.sign) } : null;

  return (
    <div className="nx-birth">
      <section className="nx-birth-date">
        <div className="nx-birth-date-c">
          <p className="nx-eb">Your date of birth</p>
          <p className="nx-birth-hint">
            {path === 'zodiac' ? 'Your sign is already chosen; the date completes your reading.' : 'Your numbers and zodiac sign are read from this date.'}
          </p>
        </div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </section>

      {(numbers || sign) && (
        <section>
          <p className="nx-eb nx-opt-label">Your reading</p>
          <div className="nx-pbs">
            {showNumbers && numbers && (
              <>
                <article className="nx-pb is-read">
                  <span className="nx-eb">Mulank</span>
                  <p className="nx-pb-v">{numbers.mulank}</p>
                  <p className="nx-pb-sub">Your birth-day number</p>
                </article>
                <article className="nx-pb is-read">
                  <span className="nx-eb">Bhagyank</span>
                  <p className="nx-pb-v">{numbers.bhagyank}</p>
                  <p className="nx-pb-sub">Your full-date number</p>
                </article>
              </>
            )}
            {showZodiac && sign && (
              <article className="nx-pb is-read">
                <span className="nx-eb">Zodiac</span>
                <p className="nx-pb-v">{sign.name}</p>
                {sign.sub && <p className="nx-pb-sub">{sign.sub}</p>}
              </article>
            )}
          </div>
        </section>
      )}
      {calibrating && <p className="nx-birth-hint">Reading your date…</p>}
    </div>
  );
}
