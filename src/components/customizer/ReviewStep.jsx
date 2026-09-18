import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import Price from '../ui/Price';
import { stepIndexOf } from '../../lib/studioFlow';
import { formatWristChoice } from '../../lib/format';

export default function ReviewStep() {
  const layer = useCustomizerStore((s) => s.layer);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const selectedIntentions = useCustomizerStore((s) => s.selectedIntentions);
  const charm = useCustomizerStore((s) => s.charm);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const beadSizeMm = useCustomizerStore((s) => s.beadSizeMm);
  const threadType = useCustomizerStore((s) => s.threadType);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const calibration = useCustomizerStore((s) => s.calibration);
  const quote = useCustomizerQuote();
  const setStep = useCustomizerStore((s) => s.setStep);
  const lines = quote.lines || [];
  const pack = quote.packaging?.lines || [];
  const title = intention?.braceletName || intention?.name || layer?.name || 'Custom strand';
  const extras = (selectedIntentions || []).slice(1);

  return (
    <article className="auth-card">
      <p className="bag-summary-kicker">The composition</p>
      <h2 className="bag-summary-title gold-text">{title}</h2>

      <dl className="bag-summary-rows">
        {layer ? (
          <div>
            <dt>Path</dt>
            <dd>{layer.modeLabel} · {layer.name}</dd>
          </div>
        ) : (
          <div>
            <dt>Intention</dt>
            <dd>
              {purpose?.name} · {intention?.name}
              {extras.length ? ` · +${extras.map((it) => it.name).join(', ')}` : ''}
            </dd>
          </div>
        )}
        {dateOfBirth ? (
          <div>
            <dt>Date of birth</dt>
            <dd>{dateOfBirth}</dd>
          </div>
        ) : null}
        {(calibration?.mulank || layer?.selections?.mulank) ? (
          <div>
            <dt>Mulank {calibration?.mulank || layer?.selections?.mulank?.number}</dt>
            <dd>{(layer?.selections?.mulank?.beads || []).join(' · ') || calibration?.mulank}</dd>
          </div>
        ) : null}
        {(calibration?.bhagyank || layer?.selections?.bhagyank) ? (
          <div>
            <dt>Bhagyank {calibration?.bhagyank || layer?.selections?.bhagyank?.number}</dt>
            <dd>{(layer?.selections?.bhagyank?.beads || []).join(' · ') || calibration?.bhagyank}</dd>
          </div>
        ) : null}
        {layer?.selections?.zodiac ? (
          <div>
            <dt>Zodiac</dt>
            <dd>
              {layer.selections.zodiac.hindi ? `${layer.selections.zodiac.hindi} / ` : ''}
              {layer.selections.zodiac.sign}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Bead size</dt>
          <dd>{beadSizeMm || 8}mm</dd>
        </div>
        {lines.map((l) => (
          <div key={l.beadId}>
            <dt>
              {l.name} × {l.quantity}
              {l.roles?.length ? ` · ${l.roles.join(' + ')}` : ''}
            </dt>
            <dd><Price value={l.subtotal} /></dd>
          </div>
        ))}
        {pack.map((row) => (
          <div key={row.key}>
            <dt>{row.label}</dt>
            <dd><Price value={row.amount} /></dd>
          </div>
        ))}
        <div>
          <dt>Charm · {charm?.name}</dt>
          <dd>{charm?.name}</dd>
        </div>
        <div>
          <dt>Wrist</dt>
          <dd>{formatWristChoice(threadType, wristSize)}</dd>
        </div>
        {engravingName ? (
          <div>
            <dt>Personalise</dt>
            <dd>{engravingName}</dd>
          </div>
        ) : null}
        <div className="bag-summary-total">
          <dt>Total</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>

      {calibration?.explanation && (
        <p className="mt-4 text-xs leading-relaxed text-lilac">{calibration.explanation}</p>
      )}

      <div className="bag-summary-actions">
        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="bag-summary-clear"
            onClick={() => setStep(stepIndexOf('choose'))}
          >
            Edit selection
          </button>
          <button
            type="button"
            className="bag-summary-clear"
            onClick={() => setStep(stepIndexOf('crystals'))}
          >
            Edit crystals
          </button>
        </div>
      </div>
    </article>
  );
}
