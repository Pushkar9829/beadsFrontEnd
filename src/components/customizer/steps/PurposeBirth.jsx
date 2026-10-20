// Step 3 of the purpose path, beeds_ecommerce StudioBuilderPage.jsx "STEP 3" (L952-1490): date of
// birth box, the three personal beads it unlocks (Mulank, Bhagyank, zodiac), and the strand rows.
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

// Personal bead cards, as in the source (StudioBuilderPage.jsx, "3 NATAL BEAD CARDS"): label, the number
// with its crystal on one row, a short line, the reason, then Add / Skip.
function Choice({ value, onChange, label }) {
  return (
    <div className="pbx-yn" role="radiogroup" aria-label={label}>
      <button type="button" role="radio" aria-checked={value === true} className={`pbx-add${value === true ? ' is-on' : ''}`} onClick={() => onChange(true)}>
        {value === true ? '✔ Add to strand' : 'Add to strand'}
      </button>
      <button type="button" role="radio" aria-checked={value === false} className={`pbx-skip${value === false ? ' is-on' : ''}`} onClick={() => onChange(false)}>
        Skip
      </button>
    </div>
  );
}

function PersonalCard({ kicker, value, sub, bead, beadName, reason, note, choice, onChange, small = false }) {
  return (
    <article className={`pbx${choice === true ? ' is-on' : ''}`}>
      <div className="pbx-k">{kicker}</div>
      <div className="pbx-row">
        <span className={`pbx-v${small ? ' is-s' : ''}`}>{value}</span>
        <div className="pbx-bead">
          <GemVisual color={bead?.colorHex || '#C6A75E'} image={bead?.image} name="" className="pbx-gem" />
          <div className="pbx-bead-t">
            <div className="pbx-name">{beadName || 'Crystal'}</div>
            {bead?.pricePerBead != null && <div className="pbx-price">{formatInr(bead.pricePerBead)}/ bead</div>}
          </div>
        </div>
      </div>
      {sub && <div className="pbx-sub">{sub}</div>}
      {reason && <div className="pbx-why">{reason}</div>}
      {note && <div className="pbx-note">{note}</div>}
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
  const signBead = findBeadByName(catalogBeads, signName);
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
    <div>
      <section className="sb-box sb-dob">
        <div className="sb-ck">Your date of birth</div>
        <div className="sb-dob-p">Your Mulank, Bhagyank and zodiac sign are read from this date.</div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </section>

      {numbers && (
        <section className="sb-pb">
          <div className="pbx-head">
            <div>
              <div className="pbx-head-k">Personal beads</div>
              <div className="pbx-head-p">Each one adds a single bead of its crystal to the strand. Choose add or skip for all three.</div>
            </div>
            <div className="pbx-quick">
              <button type="button" onClick={() => setAll(true)}>
                Add all three
              </button>
              <button type="button" onClick={() => setAll(false)}>
                Skip all
              </button>
            </div>
          </div>
          <div className="pbx-grid">
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
              value={String(numbers.sign.sign || '').toUpperCase()}
              small
              sub={dateRangeLabel(numbers.sign)}
              bead={signBead}
              beadName={signName}
              reason={signName ? `Calibrated with ${signName}${signBead?.powerUse ? ` for ${String(signBead.powerUse).toLowerCase()}` : ''}.` : ''}
              note={alreadyOn(signName) ? 'Already on your strand from the intention.' : ''}
              choice={includeZodiacBead}
              onChange={setIncludeZodiacBead}
            />
          </div>
        </section>
      )}

      {numbers && (
        <>
          <StrandList busy={calibrating} />
          {!answered && <p className="sb-wait">Choose add or skip for each personal bead to finish this step.</p>}
        </>
      )}
    </div>
  );
}
