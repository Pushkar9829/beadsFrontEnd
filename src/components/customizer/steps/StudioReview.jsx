// Review step for every studio path, beeds_ecommerce StudioBuilderPage.jsx "STEP 5: REVIEW & ORDER"
// (L1682-1969): composition banner, three summary boxes, crystals list and the price breakdown.
import { useCustomizerStore, useCustomizerQuote } from '../../../store/customizerStore';
import { stepIndexOf } from '../../../lib/studioFlow';
import { bhagyankFromDate, dateRangeLabel, mulankFromDate, zodiacFromDate, MULANK_TABLE } from '../../../lib/calibration';
import { formatInr, formatWristChoice } from '../../../lib/format';
import { useStudioLabels } from '../../../lib/studioTheme';
import { PurposeIcon } from '../PurposeGrid';
import GemVisual from '../../ui/GemVisual';
import { LiveStage } from '../PreviewPanel';
import PlaceOrderButton from '../PlaceOrderButton';

// Source badges only the personal beads (NUMBER / ZODIAC).
const ROLE_LABEL = { number: 'Number', zodiac: 'Zodiac' };

const choice = (v) => (v === true ? 'Added' : v === false ? 'Skipped' : 'Not chosen');

function readable(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Block({ title, onEdit, className = 'sb-rv-block', children }) {
  return (
    <section className={`sb-box ${className}`}>
      <div className="sb-rv-bh">
        <span className="sb-ck">{title}</span>
        {onEdit && (
          <button type="button" className="sb-link" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function StudioReview() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const threadType = useCustomizerStore((s) => s.threadType);
  const beadSizeMm = useCustomizerStore((s) => s.beadSizeMm);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const includeMulankBead = useCustomizerStore((s) => s.includeMulankBead);
  const includeBhagyankBead = useCustomizerStore((s) => s.includeBhagyankBead);
  const includeZodiacBead = useCustomizerStore((s) => s.includeZodiacBead);
  const config = useCustomizerStore((s) => s.config);
  const setStep = useCustomizerStore((s) => s.setStep);
  const path = useCustomizerStore((s) => s.path);
  const layer = useCustomizerStore((s) => s.layer);
  const quote = useCustomizerQuote();
  const labels = useStudioLabels();
  const go = (id) => () => setStep(stepIndexOf(id, path));
  const isPurpose = path === 'purpose';
  const lines = quote.lines || [];
  const pack = quote.packaging?.lines || [];
  const beadsTotal = lines.reduce((sum, l) => sum + (Number(l.subtotal) || 0), 0);

  let reading = null;
  try {
    if (dateOfBirth) reading = { mulank: mulankFromDate(dateOfBirth), bhagyank: bhagyankFromDate(dateOfBirth), sign: zodiacFromDate(dateOfBirth) };
  } catch {
    reading = null;
  }

  return (
    <div>
      <div className="sb-box sb-rv-hero">
        {isPurpose && purpose && (
          <span className="sb-rv-art" aria-hidden>
            <PurposeIcon purpose={purpose} />
          </span>
        )}
        <div>
          <div className="sb-ck">{labels.reviewKicker || 'The composition'}</div>
          <h2 className="sb-rv-t">{isPurpose ? intention?.braceletName || intention?.name || labels.customStrand || 'Custom strand' : layer?.name || labels.customStrand || 'Custom strand'}</h2>
          <div className="sb-rv-s">
            {isPurpose ? `${purpose?.name || ''}${intention?.name ? ` · ${intention.name}` : ''}` : layer?.modeLabel}
          </div>
        </div>
      </div>

      <div className="sb-rv-grid">
        {isPurpose ? (
          <Block title="Purpose & intention" onEdit={go('purpose')}>
            <div className="sb-rv-v">{purpose?.name}</div>
            <div className="sb-rv-x">{intention?.name}</div>
          </Block>
        ) : (
          <Block title={layer?.modeLabel || 'Your path'} onEdit={go('choose')}>
            <div className="sb-rv-v">{layer?.name}</div>
            {layer?.selections?.mulank && <div className="sb-rv-x">Mulank {layer.selections.mulank.number}{layer.selections.mulank.beads?.length ? ` · ${layer.selections.mulank.beads.join(', ')}` : ''}</div>}
            {layer?.selections?.bhagyank && <div className="sb-rv-x">Bhagyank {layer.selections.bhagyank.number}{layer.selections.bhagyank.beads?.length ? ` · ${layer.selections.bhagyank.beads.join(', ')}` : ''}</div>}
          </Block>
        )}

        {(isPurpose || reading) && (
          <Block title="Your reading" onEdit={go(isPurpose ? 'birth' : path === 'numerology' ? 'choose' : 'beads')}>
            {reading ? (
              <>
                <div className="sb-rv-v is-date">{readable(dateOfBirth)}</div>
                <div className="sb-rv-read">
                  <ReadingRow left={`Mulank ${reading.mulank}`} stone={isPurpose ? MULANK_TABLE[reading.mulank]?.beadName : ''} value={isPurpose ? includeMulankBead : undefined} />
                  <ReadingRow left={`Bhagyank ${reading.bhagyank}`} stone={isPurpose ? MULANK_TABLE[reading.bhagyank]?.beadName : ''} value={isPurpose ? includeBhagyankBead : undefined} />
                  <ReadingRow left={String(reading.sign.sign || '').toUpperCase()} stone={isPurpose ? reading.sign.beadName : dateRangeLabel(reading.sign)} value={isPurpose ? includeZodiacBead : undefined} />
                </div>
              </>
            ) : (
              <div className="sb-rv-x">No date of birth added.</div>
            )}
          </Block>
        )}

        <Block title="Charm & thread" onEdit={go('charm')}>
          <div className="sb-rv-v">{charm ? `${charm.name}${finish?.label ? ` · ${finish.label}` : ''}` : 'No charm chosen'}</div>
          <div className="sb-rv-x">{formatWristChoice(threadType, wristSize, config?.threadTypes)}</div>
          <div className="sb-rv-x">{labels.rowBeadSize || 'Bead size'} {beadSizeMm || 8}mm</div>
        </Block>
      </div>

      <Block title={`Crystals · ${quote.beadCount || 0} beads`} onEdit={go(isPurpose ? 'birth' : 'beads')} className="sb-rv-crystals">
        <ul className="sb-rv-lines">
          {lines.map((l) => {
            const roles = [...new Set((l.roles || []).map((r) => ROLE_LABEL[r]).filter(Boolean))];
            return (
              <li key={l.beadId} className="sb-rv-line">
                <div className="sb-rv-line-l">
                  <GemVisual color={l.colorHex} image={l.image} name={l.name} className="sb-rv-dot" />
                  <div>
                    <div className="sb-rv-nm">
                      <span className="sb-rv-name">{l.name}</span>
                      {roles.map((r) => (
                        <span key={r} className="sb-badge">
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="sb-rv-q">
                      {l.quantity} × {formatInr(l.pricePerBead)}
                    </div>
                  </div>
                </div>
                <span className="sb-rv-amt">{formatInr(l.subtotal)}</span>
              </li>
            );
          })}
        </ul>
      </Block>

      <section className="sb-box sb-rv-bill">
        <div className="sb-rv-bill-rows">
          <div>
            <span>Crystals</span>
            <span>{formatInr(beadsTotal)}</span>
          </div>
          {pack.map((row) => (
            <div key={row.key}>
              <span>{row.label}</span>
              <span>{formatInr(row.amount)}</span>
            </div>
          ))}
        </div>
        <div className="sb-rv-total">
          <span>{labels.totalLabel || 'Total'}</span>
          <b>{formatInr(quote.total)}</b>
        </div>
        <div className="sb-rv-note">Delivery and taxes are worked out at checkout.</div>
      </section>
    </div>
  );
}

function ReadingRow({ left, stone, value }) {
  const chosen = value === true || value === false;
  return (
    <div>
      <span>{left}</span>
      <span className={value === true ? 'is-add' : chosen || value === null ? 'is-skip' : ''}>
        {stone}
        {value !== undefined ? ` · ${choice(value)}` : ''}
      </span>
    </div>
  );
}

/** Right column on the review step (source L2149-2191): the bracelet, the total and the order button. */
export function ReviewSide() {
  const quote = useCustomizerQuote();
  const labels = useStudioLabels();
  return (
    <aside className="sb-panel sb-live">
      <LiveStage />
      <div className="sb-rs-total">
        <span>
          {labels.totalLabel || 'Total'} · {quote.beadCount || 0} beads
        </span>
        <b>{formatInr(quote.total)}</b>
      </div>
      <PlaceOrderButton className="sb-order" />
      <div className="sb-rs-note">The piece goes to your bag; delivery and taxes are added at checkout.</div>
    </aside>
  );
}
