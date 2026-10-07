import PurposeBirth from './PurposeBirth';
import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate, zodiacFromDate, dateRangeLabel } from '../../../lib/calibration';
import DateFields from '../DateFields';

export default function BirthStep() {
  const path = useCustomizerStore((s) => s.path);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const showNumbers = path !== 'zodiac';
  const showZodiac = path !== 'numerology';

  let numbers = null;
  if (dateOfBirth) {
    try {
      numbers = {
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
        sign: zodiacFromDate(dateOfBirth),
      };
    } catch {
      numbers = null;
    }
  }

  if (path === 'purpose') return <PurposeBirth />;

  return (
    <div className="space-y-10">
      <section>
        <div className="auth-card">
          <p className="studio-birth-kicker">Date of birth</p>
          <p className="mt-2 text-sm text-lilac">Choose the day, month, and year.</p>
          <div className="mt-4">
            <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
          </div>
        </div>
        {numbers || (path === 'zodiac' && layerItem) ? (
          <div className={`mt-6 grid gap-3 ${showNumbers && showZodiac ? 'sm:grid-cols-3' : showNumbers ? 'sm:grid-cols-2' : ''}`}>
            {showNumbers && numbers ? (
              <>
                <div className="rounded-2xl border border-[rgba(198,167,94,0.35)] px-4 py-5 text-center">
                  <p className="studio-birth-kicker">Mulank</p>
                  <p className="mt-2 font-serif text-5xl text-gold">{numbers.mulank}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(198,167,94,0.35)] px-4 py-5 text-center">
                  <p className="studio-birth-kicker">Bhagyank</p>
                  <p className="mt-2 font-serif text-5xl text-gold">{numbers.bhagyank}</p>
                </div>
              </>
            ) : null}
            {showZodiac && (path === 'zodiac' ? layerItem : numbers) ? (
              <div className="rounded-2xl border border-[rgba(198,167,94,0.35)] px-4 py-5 text-center">
                <p className="studio-birth-kicker">Zodiac</p>
                <p className="mt-2 font-serif text-3xl text-gold">{path === 'zodiac' ? layerItem.name : numbers.sign.sign}</p>
                <p className="mt-2 text-xs text-lilac">{path === 'zodiac' ? (layerItem.dates || '') : dateRangeLabel(numbers.sign)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      {calibrating ? <p className="studio-birth-note">Calibrating…</p> : null}
    </div>
  );
}
