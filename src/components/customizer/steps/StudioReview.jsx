// Review step for every studio path: the whole composition on one page, each part with a
// link back to the step that sets it, then the price.
import { useCustomizerStore, useCustomizerQuote } from '../../../store/customizerStore';
import { stepIndexOf } from '../../../lib/studioFlow';
import { bhagyankFromDate, dateRangeLabel, mulankFromDate, zodiacFromDate, MULANK_TABLE } from '../../../lib/calibration';
import { formatInr, formatWristChoice } from '../../../lib/format';
import { useStudioLabels } from '../../../lib/studioTheme';
import { PurposeIcon } from '../PurposeGrid';
import GemVisual from '../../ui/GemVisual';
import BraceletPreview from '../../../preview/BraceletScene';
import PlaceOrderButton from '../PlaceOrderButton';

const ROLE_LABEL = { 'intention-primary': 'Intention', intention: 'Intention', number: 'Number', zodiac: 'Zodiac' };

function readable(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Block({ title, onEdit, children }) {
  return (
    <section className="nx-rv-block">
      <div className="nx-rv-head">
        <p className="nx-eb">{title}</p>
        {onEdit && (
          <button type="button" className="nx-chosen-edit" onClick={onEdit}>
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
  const choice = (v) => (v === true ? 'Added' : v === false ? 'Skipped' : 'Not chosen');

  return (
    <div className="nx-rv">
      <div className="nx-rv-hero">
        {isPurpose && purpose && (
          <span className="nx-chosen-art" aria-hidden>
            <PurposeIcon purpose={purpose} />
          </span>
        )}
        <div>
          <p className="nx-eb">{labels.reviewKicker || 'The composition'}</p>
          <h2 className="nx-rv-t">{isPurpose ? intention?.braceletName || intention?.name || labels.customStrand || 'Custom strand' : layer?.name || labels.customStrand || 'Custom strand'}</h2>
          <p className="nx-birth-hint">
            {isPurpose ? `${purpose?.name || ''}${intention?.name ? ` · ${intention.name}` : ''}` : layer?.modeLabel}
          </p>
        </div>
      </div>

      <div className="nx-rv-grid">
        {isPurpose ? (
          <Block title="Purpose & intention" onEdit={go('intention')}>
            <p className="nx-rv-v">{purpose?.name}</p>
            <p className="nx-rv-s">{intention?.name}</p>
          </Block>
        ) : (
          <Block title={layer?.modeLabel || 'Your path'} onEdit={go('choose')}>
            <p className="nx-rv-v">{layer?.name}</p>
            {layer?.selections?.mulank && <p className="nx-rv-s">Mulank {layer.selections.mulank.number}{layer.selections.mulank.beads?.length ? ` · ${layer.selections.mulank.beads.join(', ')}` : ''}</p>}
            {layer?.selections?.bhagyank && <p className="nx-rv-s">Bhagyank {layer.selections.bhagyank.number}{layer.selections.bhagyank.beads?.length ? ` · ${layer.selections.bhagyank.beads.join(', ')}` : ''}</p>}
          </Block>
        )}

        <Block title="Your reading" onEdit={go('birth')}>
          {reading ? (
            <>
              <p className="nx-rv-v">{readable(dateOfBirth)}</p>
              <ul className="nx-rv-list">
                <li>
                  <span>Mulank {reading.mulank}</span>
                  <span>
                    {isPurpose ? `${MULANK_TABLE[reading.mulank]?.beadName} · ${choice(includeMulankBead)}` : ''}
                  </span>
                </li>
                <li>
                  <span>Bhagyank {reading.bhagyank}</span>
                  <span>
                    {isPurpose ? `${MULANK_TABLE[reading.bhagyank]?.beadName} · ${choice(includeBhagyankBead)}` : ''}
                  </span>
                </li>
                <li>
                  <span>{reading.sign.sign}</span>
                  <span>
                    {isPurpose ? `${reading.sign.beadName} · ${choice(includeZodiacBead)}` : dateRangeLabel(reading.sign)}
                  </span>
                </li>
              </ul>
            </>
          ) : (
            <p className="nx-rv-s">No date of birth added.</p>
          )}
        </Block>

        <Block title="Charm & thread" onEdit={go('charm')}>
          <p className="nx-rv-v">{charm ? `${charm.name}${finish?.label ? ` · ${finish.label}` : ''}` : 'No charm chosen'}</p>
          <p className="nx-rv-s">{formatWristChoice(threadType, wristSize, config?.threadTypes)}</p>
          <p className="nx-rv-s">{labels.rowBeadSize || 'Bead size'} · {beadSizeMm || 8}mm</p>
        </Block>
      </div>

      <Block title={`Crystals · ${quote.beadCount || 0} beads`} onEdit={go(isPurpose ? 'birth' : 'beads')}>
        <ul className="nx-cm-lines nx-rv-lines">
          {lines.map((l) => {
            const roles = [...new Set((l.roles || []).map((r) => ROLE_LABEL[r] || r))];
            return (
              <li key={l.beadId}>
                <GemVisual color={l.colorHex} image={l.image} name={l.name} className="nx-cm-dot" />
                <span className="nx-cm-line-c">
                  <span className="nx-cm-name">
                    {l.name}
                    {roles.map((r) => (
                      <i key={r} className="nx-role">
                        {r}
                      </i>
                    ))}
                  </span>
                  <span className="nx-cm-price">
                    {l.quantity} × {formatInr(l.pricePerBead)}
                  </span>
                </span>
                <span className="nx-rv-amt">{formatInr(l.subtotal)}</span>
              </li>
            );
          })}
        </ul>
      </Block>

      <section className="nx-rv-bill">
        <dl>
          <div>
            <dt>Crystals</dt>
            <dd>{formatInr(beadsTotal)}</dd>
          </div>
          {pack.map((row) => (
            <div key={row.key}>
              <dt>{row.label}</dt>
              <dd>{formatInr(row.amount)}</dd>
            </div>
          ))}
          <div className="is-total">
            <dt>{labels.totalLabel || 'Total'}</dt>
            <dd>{formatInr(quote.total)}</dd>
          </div>
        </dl>
        <p className="nx-birth-hint">Delivery and taxes are worked out at checkout.</p>
      </section>
    </div>
  );
}

/** Right column on the review step: the bracelet, the total and the order button. */
export function ReviewSide() {
  const quote = useCustomizerQuote();
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const finish = useCustomizerStore((s) => s.finish);
  const charm = useCustomizerStore((s) => s.charm);
  const labels = useStudioLabels();
  return (
    <aside className="nx-guide nx-rv-side">
      <BraceletPreview lines={quote.lines} wristSize={wristSize} finish={finish} charm={charm} />
      <div className="nx-rv-side-total">
        <span>
          {labels.totalLabel || 'Total'} · {quote.beadCount || 0} beads
        </span>
        <b>{formatInr(quote.total)}</b>
      </div>
      <PlaceOrderButton className="w-full" />
      <p className="nx-guide-note">The piece goes to your bag; delivery and taxes are added at checkout.</p>
    </aside>
  );
}
