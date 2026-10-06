import ZodiacStep from './ZodiacStep';
import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, findBeadByName, mulankFromDate, zodiacFromDate, dateRangeLabel, MULANK_TABLE } from '../../../lib/calibration';
import DateFields from '../DateFields';
import GemVisual from '../../ui/GemVisual';

function YesNo({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[
        [true, 'Yes'],
        [false, 'No'],
      ].map(([next, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(next)}
          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
            value === next
              ? 'border-[#c6a75e] bg-[#140c18] text-gold'
              : 'border-[rgba(198,167,94,0.35)] text-lilac hover:border-[#c6a75e]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BeadCells({ kicker, value, bead, name, choice, onChange }) {
  return (
    <>
      <div className="purpose-birth-cell purpose-birth-label">
        <strong>{kicker}</strong>
        <span className="font-serif">{value}</span>
      </div>
      <div className="purpose-birth-cell flex items-center gap-3">
        <GemVisual
          color={bead?.colorHex || '#C6A75E'}
          image={bead?.image}
          name=""
          className="h-10 w-10 shrink-0 rounded-full"
        />
        <p className="studio-bead-name truncate">{name}</p>
      </div>
      <div className="purpose-birth-cell flex items-center">
        <YesNo value={choice} onChange={onChange} />
      </div>
    </>
  );
}

export default function BirthStep() {
  const path = useCustomizerStore((s) => s.path);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const includeMulankBead = useCustomizerStore((s) => s.includeMulankBead);
  const includeBhagyankBead = useCustomizerStore((s) => s.includeBhagyankBead);
  const includeZodiacBead = useCustomizerStore((s) => s.includeZodiacBead);
  const setIncludeNumberBead = useCustomizerStore((s) => s.setIncludeNumberBead);
  const setIncludeZodiacBead = useCustomizerStore((s) => s.setIncludeZodiacBead);
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

  if (path === 'purpose') {
    const mulankName = numbers ? MULANK_TABLE[numbers.mulank]?.beadName : '';
    const bhagyankName = numbers ? MULANK_TABLE[numbers.bhagyank]?.beadName : '';
    const signBead = numbers?.sign?.beadName || '';
    return (
      <div className="space-y-6">
        <div className="purpose-birth-table">
          <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
          {numbers ? (
            <>
              <BeadCells
                kicker="Mulank"
                value={numbers.mulank}
                bead={findBeadByName(catalogBeads, mulankName)}
                name={mulankName}
                choice={includeMulankBead}
                onChange={(yes) => setIncludeNumberBead('mulank', yes)}
              />
              <BeadCells
                kicker="Bhagyank"
                value={numbers.bhagyank}
                bead={findBeadByName(catalogBeads, bhagyankName)}
                name={bhagyankName}
                choice={includeBhagyankBead}
                onChange={(yes) => setIncludeNumberBead('bhagyank', yes)}
              />
              <BeadCells
                kicker="Zodiac"
                value={numbers.sign.sign}
                bead={findBeadByName(catalogBeads, signBead)}
                name={signBead}
                choice={includeZodiacBead}
                onChange={setIncludeZodiacBead}
              />
            </>
          ) : null}
        </div>
        {numbers ? <ZodiacStep listOnly /> : null}
        {calibrating ? <p className="studio-birth-note">Calibrating…</p> : null}
      </div>
    );
  }

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
