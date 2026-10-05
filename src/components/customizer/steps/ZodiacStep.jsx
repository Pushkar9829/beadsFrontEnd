import { useEffect, useRef } from 'react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { qtyOf } from '../../../lib/studioFlow';
import { zodiacFromDate, dateRangeLabel } from '../../../lib/calibration';
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
  const includeZodiacBead = useCustomizerStore((s) => s.includeZodiacBead);
  const setIncludeZodiacBead = useCustomizerStore((s) => s.setIncludeZodiacBead);
  const seeded = useRef(false);
  const target = [16, 18, 22].includes(Number(strandCount)) ? Number(strandCount) : 18;
  const total = (recommended || []).reduce((sum, bead) => sum + qtyOf(quantities, bead._id), 0);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const zodiac = calibration?.zodiac;
  const sign = dateOfBirth ? (() => { try { return zodiacFromDate(dateOfBirth); } catch { return null; } })() : null;
  const signName = zodiac?.sign || sign?.sign || '';
  const signRange = zodiac?.dateRange || (sign ? dateRangeLabel(sign) : '');
  const signBead = zodiac?.bead?.name || sign?.beadName || '';

  useEffect(() => {
    if (path === 'purpose') return;
    if (seeded.current || !calibration || zodiacAdded || calibrating) return;
    seeded.current = true;
    addZodiacBeads(calibration.zodiacQty || 2);
  }, [path, calibration, zodiacAdded, calibrating, addZodiacBeads]);

  if (path !== 'purpose' && (!calibration || calibrating)) return <Spinner label="Placing the beads" />;
  if (path === 'purpose' && calibrating) return <Spinner label="Placing the beads" />;

  const rows = path === 'purpose'
    ? recommended.filter((bead) => {
      const zodiacOnly = (bead.roles || []).includes('zodiac') && qtyOf(quantities, bead._id) < 1 && includeZodiacBead !== true;
      return !zodiacOnly;
    })
    : recommended;

  return (
    <div className="studio-birth">
      {path === 'purpose' ? (
        <div>
          <p className="font-serif text-2xl text-gold">{signName || 'Zodiac'}</p>
          <p className="mt-1 text-sm text-lilac">
            {signRange ? `${signRange} · ` : ''}{signBead}
          </p>
          <p className="mt-2 text-sm text-lilac">Add this zodiac bead to the strand?</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIncludeZodiacBead(true)}
              className={`rounded-2xl border px-4 py-5 text-center ${includeZodiacBead === true ? 'border-[#c6a75e] bg-[#140c18] shadow-[0_0_0_2px_rgba(198,167,94,0.4)]' : 'border-[rgba(198,167,94,0.35)]'}`}
            >
              <span className="block font-serif text-3xl text-gold">Yes</span>
              <span className="mt-2 block text-sm text-lilac">Add {signBead || 'the zodiac bead'} below.</span>
            </button>
            <button
              type="button"
              onClick={() => setIncludeZodiacBead(false)}
              className={`rounded-2xl border px-4 py-5 text-center ${includeZodiacBead === false ? 'border-[#c6a75e] bg-[#140c18] shadow-[0_0_0_2px_rgba(198,167,94,0.4)]' : 'border-[rgba(198,167,94,0.35)]'}`}
            >
              <span className="block font-serif text-3xl text-gold">No</span>
              <span className="mt-2 block text-sm text-lilac">Leave the zodiac bead off.</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="studio-birth-kicker">{signName || 'Zodiac'}</p>
      )}
      {path !== 'purpose' ? (
        <p className="mt-2 text-sm text-lilac">
          {signRange || 'From your date of birth'}
          {signBead ? ` · ${signBead}` : ''}
        </p>
      ) : null}
      <p className={`studio-birth-note mt-4 ${total === target ? '' : 'is-error'}`}>
        {total} of {target} beads
        {total === target ? '. The strand matches.' : '. Select, deselect, or change a count until they match.'}
      </p>

      <div className="studio-crystal-list mt-5">
        {rows.map((bead) => {
          const qty = qtyOf(quantities, bead._id);
          const on = qty > 0;
          const role = (bead.roles || []).map((key) => ROLE_LABEL[key] || key).filter(Boolean).join(' · ');
          return (
            <div key={bead._id} className={`studio-crystal studio-crystal-line ${on ? 'is-on' : ''}`}>
              <button
                type="button"
                className="studio-bead-box"
                aria-pressed={on}
                onClick={() => setBeadQty(bead._id, on ? 0 : 1, { force: !on })}
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
