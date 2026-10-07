// Step 3 of the purpose path: date of birth, the three personal beads it unlocks
// (Mulank, Bhagyank, zodiac), and the strand count.
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { bhagyankFromDate, dateRangeLabel, findBeadByName, mulankFromDate, zodiacFromDate, MULANK_TABLE } from '../../../lib/calibration';
import { formatInr } from '../../../lib/format';
import DateFields from '../DateFields';
import GemVisual from '../../ui/GemVisual';
import StrandList, { personalOnly } from '../StrandList';

function readDate(dateOfBirth) {
  if (!dateOfBirth) return null;
  try {
    return {
      mulank: mulankFromDate(dateOfBirth),
      bhagyank: bhagyankFromDate(dateOfBirth),
      sign: zodiacFromDate(dateOfBirth),
    };
  } catch {
    return null;
  }
}

function Choice({ value, onChange, label }) {
  return (
    <div className="nx-yn" role="radiogroup" aria-label={label}>
      <button type="button" role="radio" aria-checked={value === true} className={value === true ? 'is-on' : ''} onClick={() => onChange(true)}>
        {value === true && <Check size={13} strokeWidth={2.4} />} Add to strand
      </button>
      <button type="button" role="radio" aria-checked={value === false} className={value === false ? 'is-off' : ''} onClick={() => onChange(false)}>
        Skip
      </button>
    </div>
  );
}

function PersonalCard({ kicker, value, sub, bead, beadName, reason, note, choice, onChange }) {
  const state = choice === true ? ' is-on' : choice === false ? ' is-off' : ' is-open';
  return (
    <article className={`nx-pb${state}`}>
      <div className="nx-pb-top">
        <span className="nx-eb">{kicker}</span>
        {choice == null && <span className="nx-pb-flag">Choose</span>}
      </div>
      <div className="nx-pb-mid">
        <div>
          <p className="nx-pb-v">{value}</p>
          {sub && <p className="nx-pb-sub">{sub}</p>}
        </div>
        <div className="nx-pb-bead">
          <GemVisual color={bead?.colorHex || '#C6A75E'} image={bead?.image} name="" className="nx-pb-gem" />
          <span>
            <b>{beadName || 'Crystal'}</b>
            {bead?.pricePerBead != null && <em>{formatInr(bead.pricePerBead)} / bead</em>}
          </span>
        </div>
      </div>
      {reason && <p className="nx-pb-why">{reason}</p>}
      {note && <p className="nx-pb-note">{note}</p>}
      <Choice value={choice} onChange={onChange} label={`${kicker} bead`} />
    </article>
  );
}

export default function PurposeBirth() {
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const includeMulankBead = useCustomizerStore((s) => s.includeMulankBead);
  const includeBhagyankBead = useCustomizerStore((s) => s.includeBhagyankBead);
  const includeZodiacBead = useCustomizerStore((s) => s.includeZodiacBead);
  const setIncludeNumberBead = useCustomizerStore((s) => s.setIncludeNumberBead);
  const setIncludeZodiacBead = useCustomizerStore((s) => s.setIncludeZodiacBead);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const numberBeadIds = useCustomizerStore((s) => s.numberBeadIds);

  const numbers = readDate(dateOfBirth);
  const answered = [includeMulankBead, includeBhagyankBead, includeZodiacBead].every((v) => v === true || v === false);

  const mulankName = numbers ? MULANK_TABLE[numbers.mulank]?.beadName : '';
  const bhagyankName = numbers ? MULANK_TABLE[numbers.bhagyank]?.beadName : '';
  const signName = numbers?.sign?.beadName || '';
  const numberIds = new Set((numberBeadIds || []).map(String));
  // A personal crystal that the intention already put on the strand adds no extra bead.
  const alreadyOn = (name) =>
    Boolean(name) &&
    (recommended || []).some((b) => b.name === name && qtyOf(quantities, b._id) > 0 && !numberIds.has(String(b._id)) && !personalOnly(b));

  function setAll(yes) {
    setIncludeNumberBead('mulank', yes);
    setIncludeNumberBead('bhagyank', yes);
    setIncludeZodiacBead(yes);
  }

  return (
    <div className="nx-birth">
      <section className="nx-birth-date">
        <div className="nx-birth-date-c">
          <p className="nx-eb">Your date of birth</p>
          <p className="nx-birth-hint">Your Mulank, Bhagyank and zodiac sign are read from this date.</p>
        </div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </section>

      {numbers && (
        <section className="nx-birth-sec">
          <div className="nx-birth-head">
            <div>
              <p className="nx-eb">Personal beads</p>
              <p className="nx-birth-hint">Each one adds a single bead of its crystal to the strand. Choose add or skip for all three.</p>
            </div>
            <div className="nx-birth-quick">
              <button type="button" onClick={() => setAll(true)}>
                Add all three
              </button>
              <button type="button" onClick={() => setAll(false)}>
                Skip all
              </button>
            </div>
          </div>
          <div className="nx-pbs">
            <PersonalCard
              kicker="Mulank"
              value={numbers.mulank}
              sub="Your birth-day number"
              bead={findBeadByName(catalogBeads, mulankName)}
              beadName={mulankName}
              reason={MULANK_TABLE[numbers.mulank]?.reason}
              note={alreadyOn(mulankName) ? 'Already on your strand from the intention.' : ''}
              choice={includeMulankBead}
              onChange={(yes) => setIncludeNumberBead('mulank', yes)}
            />
            <PersonalCard
              kicker="Bhagyank"
              value={numbers.bhagyank}
              sub="Your full-date number"
              bead={findBeadByName(catalogBeads, bhagyankName)}
              beadName={bhagyankName}
              reason={MULANK_TABLE[numbers.bhagyank]?.reason?.replace(/^Mulank/, 'Number')}
              note={
                bhagyankName && bhagyankName === mulankName
                  ? 'Same crystal as your Mulank. It is placed once.'
                  : alreadyOn(bhagyankName)
                    ? 'Already on your strand from the intention.'
                    : ''
              }
              choice={includeBhagyankBead}
              onChange={(yes) => setIncludeNumberBead('bhagyank', yes)}
            />
            <PersonalCard
              kicker="Zodiac"
              value={numbers.sign.sign}
              sub={dateRangeLabel(numbers.sign)}
              bead={findBeadByName(catalogBeads, signName)}
              beadName={signName}
              note={alreadyOn(signName) ? 'Already on your strand from the intention.' : ''}
              choice={includeZodiacBead}
              onChange={setIncludeZodiacBead}
            />
          </div>
        </section>
      )}

      {numbers && (
        <div className="nx-birth-sec">
          <StrandList busy={calibrating} />
          {!answered && <p className="nx-birth-hint nx-birth-wait">Choose add or skip for each personal bead to finish this step.</p>}
        </div>
      )}
    </div>
  );
}
