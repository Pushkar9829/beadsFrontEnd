// The strand as a list: one row per crystal with -/+ counts, a progress line against the
// strand length and a one-tap "Balance the strand". Used by every studio path.
import { Minus, Plus } from 'lucide-react';
import { useCustomizerStore } from '../../store/customizerStore';
import { qtyOf } from '../../lib/studioFlow';
import { formatInr } from '../../lib/format';
import GemVisual from '../ui/GemVisual';

const ROLE_LABEL = {
  'intention-primary': 'Intention',
  intention: 'Intention',
  number: 'Number',
  zodiac: 'Zodiac',
  Mulank: 'Mulank',
  Bhagyank: 'Bhagyank',
};

// Personal beads (numbers, zodiac) keep their single bead when the strand is balanced.
const PERSONAL = new Set(['number', 'zodiac']);
export const personalOnly = (b) => (b.roles || []).length > 0 && (b.roles || []).every((r) => PERSONAL.has(r));

export function strandTarget(strandCount) {
  return [16, 18, 22].includes(Number(strandCount)) ? Number(strandCount) : 18;
}

// Brings the strand to exactly `target` beads: trims the fullest flexible crystals first,
// or tops up the lightest ones.
function balancedCounts(beads, quantities, target) {
  const on = beads.filter((b) => qtyOf(quantities, b._id) > 0);
  if (!on.length) return null;
  const next = Object.fromEntries(on.map((b) => [String(b._id), qtyOf(quantities, b._id)]));
  const flexible = on.filter((b) => !personalOnly(b));
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

export default function StrandList({ title = 'Your strand', rows: rowsProp, busy = false, busyLabel = 'Placing the beads…', roleLabels }) {
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const setBeadQty = useCustomizerStore((s) => s.setBeadQty);
  const target = strandTarget(strandCount);
  const total = (recommended || []).reduce((sum, bead) => sum + qtyOf(quantities, bead._id), 0);
  const over = Math.max(0, total - target);
  const short = Math.max(0, target - total);
  const rows = rowsProp || (recommended || []).filter((bead) => qtyOf(quantities, bead._id) > 0 || !personalOnly(bead));

  function balance() {
    const next = balancedCounts(recommended || [], quantities, target);
    if (!next) return;
    // Lower counts first so the raises always have room.
    Object.entries(next)
      .sort(([a], [b]) => next[a] - qtyOf(quantities, a) - (next[b] - qtyOf(quantities, b)))
      .forEach(([id, n]) => {
        if (n !== qtyOf(quantities, id)) setBeadQty(id, n);
      });
  }

  return (
    <section>
      <div className="nx-birth-head">
        <div>
          <p className="nx-eb">{title}</p>
          <p className={`nx-birth-count${over ? ' is-over' : short ? ' is-short' : ' is-full'}`}>
            {total} of {target} beads
            {over ? ` · ${over} too many` : short ? ` · ${short} to place` : ' · the strand matches'}
          </p>
        </div>
        {total !== target && total > 0 && (
          <button type="button" className="nx-cm-addbtn" onClick={balance}>
            Balance the strand
          </button>
        )}
      </div>
      <div className="nx-cm-bar" aria-hidden>
        <span style={{ width: `${Math.min(100, (total / target) * 100)}%` }} />
      </div>
      {busy ? (
        <p className="nx-birth-hint">{busyLabel}</p>
      ) : (
        <ul className="nx-cm-lines">
          {rows.map((bead) => {
            const qty = qtyOf(quantities, bead._id);
            const labels = { ...ROLE_LABEL, ...roleLabels };
            const roles = [...new Set((bead.roles || []).map((key) => labels[key] || key).filter(Boolean))];
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
    </section>
  );
}
