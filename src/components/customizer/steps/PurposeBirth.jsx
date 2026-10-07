// Step 3 of the purpose path: date of birth, the three personal beads it unlocks
// (Mulank, Bhagyank, zodiac), and the strand count. Same store actions as before;
// the other studio paths keep BirthStep's original layout.
import { Check, Minus, Plus } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { bhagyankFromDate, dateRangeLabel, findBeadByName, mulankFromDate, zodiacFromDate, MULANK_TABLE } from '../../../lib/calibration';
import { formatInr } from '../../../lib/format';
import DateFields from '../DateFields';
import GemVisual from '../../ui/GemVisual';

const ROLE_LABEL = {
  'intention-primary': 'Intention',
  intention: 'Intention',
  number: 'Number',
  zodiac: 'Zodiac',
};

const PERSONAL = new Set(['number', 'zodiac']);

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

// Brings the strand to exactly `target` beads: trims the fullest intention crystals first
// (personal beads keep their single bead), or tops up the lightest ones.
function balancedCounts(beads, quantities, target) {
  const on = beads.filter((b) => qtyOf(quantities, b._id) > 0);
  if (!on.length) return null;
  const next = Object.fromEntries(on.map((b) => [String(b._id), qtyOf(quantities, b._id)]));
  const isPersonal = (b) => (b.roles || []).length > 0 && (b.roles || []).every((r) => PERSONAL.has(r));
  const flexible = on.filter((b) => !isPersonal(b));
  const pool = flexible.length ? flexible : on;
  let total = Object.values(next).reduce((s, n) => s + n, 0);
  let guard = 200;
  while (total > target && guard-- > 0) {
    const pick = [...pool].filter((b) => next[String(b._id)] > 1).sort((a, b) => next[String(b._id)] - next[String(a._id)])[0];
    if (!pick) break;
    next[String(pick._id)] -= 1;
    total -= 1;
  }
  while (total < target && guard-- > 0) {
    const pick = [...pool].sort((a, b) => next[String(a._id)] - next[String(b._id)])[0];
    next[String(pick._id)] += 1;
    total += 1;
  }
  return total === target ? next : null;
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
      <p className="nx-pb-v">{value}</p>
      {sub && <p className="nx-pb-sub">{sub}</p>}
      <div className="nx-pb-bead">
        <GemVisual color={bead?.colorHex || '#C6A75E'} image={bead?.image} name="" className="nx-pb-gem" />
        <span>
          <b>{beadName || 'Crystal'}</b>
          {bead?.pricePerBead != null && <em>{formatInr(bead.pricePerBead)} / bead</em>}
        </span>
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
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const setBeadQty = useCustomizerStore((s) => s.setBeadQty);

  const numbers = readDate(dateOfBirth);
  const target = [16, 18, 22].includes(Number(strandCount)) ? Number(strandCount) : 18;
  const total = (recommended || []).reduce((sum, bead) => sum + qtyOf(quantities, bead._id), 0);
  const answered = [includeMulankBead, includeBhagyankBead, includeZodiacBead].every((v) => v === true || v === false);

  const mulankName = numbers ? MULANK_TABLE[numbers.mulank]?.beadName : '';
  const bhagyankName = numbers ? MULANK_TABLE[numbers.bhagyank]?.beadName : '';
  const signName = numbers?.sign?.beadName || '';
  const numberIds = new Set((numberBeadIds || []).map(String));
  // A personal crystal that the intention already put on the strand adds no extra bead.
  const personalOnly = (b) => (b.roles || []).length > 0 && (b.roles || []).every((r) => PERSONAL.has(r));
  const alreadyOn = (name) =>
    Boolean(name) &&
    (recommended || []).some((b) => b.name === name && qtyOf(quantities, b._id) > 0 && !numberIds.has(String(b._id)) && !personalOnly(b));

  function setAll(yes) {
    setIncludeNumberBead('mulank', yes);
    setIncludeNumberBead('bhagyank', yes);
    setIncludeZodiacBead(yes);
  }

  function balance() {
    const next = balancedCounts(recommended || [], quantities, target);
    if (!next) return;
    const entries = Object.entries(next).sort(([a], [b]) => (next[a] - qtyOf(quantities, a)) - (next[b] - qtyOf(quantities, b)));
    entries.forEach(([id, n]) => {
      if (n !== qtyOf(quantities, id)) setBeadQty(id, n);
    });
  }

  const rows = (recommended || []).filter((bead) => {
    const personalOnly = (bead.roles || []).length > 0 && (bead.roles || []).every((r) => PERSONAL.has(r));
    return qtyOf(quantities, bead._id) > 0 || !personalOnly;
  });
  const over = Math.max(0, total - target);
  const short = Math.max(0, target - total);

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
        <section className="nx-birth-sec">
          <div className="nx-birth-head">
            <div>
              <p className="nx-eb">Your strand</p>
              <p className={`nx-birth-count${over ? ' is-over' : short ? ' is-short' : ' is-full'}`}>
                {total} of {target} beads
                {over ? ` · ${over} too many` : short ? ` · ${short} to place` : ' · the strand matches'}
              </p>
            </div>
            {total !== target && (
              <button type="button" className="nx-cm-addbtn" onClick={balance}>
                Balance the strand
              </button>
            )}
          </div>
          <div className="nx-cm-bar" aria-hidden>
            <span style={{ width: `${Math.min(100, (total / target) * 100)}%` }} />
          </div>
          {calibrating ? (
            <p className="nx-birth-hint">Placing the beads…</p>
          ) : (
            <ul className="nx-cm-lines">
              {rows.map((bead) => {
                const qty = qtyOf(quantities, bead._id);
                const roles = [...new Set((bead.roles || []).map((key) => ROLE_LABEL[key] || key).filter(Boolean))];
                return (
                  <li key={bead._id} className={qty ? '' : 'is-off'}>
                    <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="nx-cm-dot" />
                    <span className="nx-cm-line-c">
                      <span className="nx-cm-name">
                        {bead.name}
                        {roles.map((r) => (
                          <i key={r} className="nx-role">
                            {r}
                          </i>
                        ))}
                      </span>
                      <span className="nx-cm-price">
                        {formatInr(bead.pricePerBead)} / bead{qty ? ` · ${formatInr((bead.pricePerBead || 0) * qty)}` : ' · not on the strand'}
                      </span>
                    </span>
                    <span className="nx-qty nx-cm-qty" aria-label={`${bead.name} quantity`}>
                      <button type="button" aria-label={`One less ${bead.name}`} disabled={qty <= 0} onClick={() => setBeadQty(bead._id, qty - 1)}>
                        <Minus size={13} />
                      </button>
                      <span aria-live="polite">{qty}</span>
                      <button type="button" aria-label={`One more ${bead.name}`} disabled={total >= target} onClick={() => setBeadQty(bead._id, qty + 1, { force: qty === 0 })}>
                        <Plus size={13} />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {!answered && <p className="nx-birth-hint nx-birth-wait">Choose add or skip for each personal bead to finish this step.</p>}
        </section>
      )}
    </div>
  );
}
