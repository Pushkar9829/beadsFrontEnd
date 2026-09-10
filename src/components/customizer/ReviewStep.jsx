import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import PlaceOrderButton from './PlaceOrderButton';
import Price from '../ui/Price';
import { formatWristChoice } from '../../lib/format';

export default function ReviewStep() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const charm = useCustomizerStore((s) => s.charm);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const threadType = useCustomizerStore((s) => s.threadType);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const calibration = useCustomizerStore((s) => s.calibration);
  const quote = useCustomizerQuote();
  const goBack = useCustomizerStore((s) => s.goBack);
  const setStep = useCustomizerStore((s) => s.setStep);
  const lines = quote.lines || [];

  return (
    <article className="auth-card">
      <p className="bag-summary-kicker">The composition</p>
      <h2 className="bag-summary-title gold-text">{intention?.name || 'Custom strand'}</h2>

      <dl className="bag-summary-rows">
        <div>
          <dt>Intention</dt>
          <dd>{purpose?.name} · {intention?.name}</dd>
        </div>
        <div>
          <dt>Date of birth</dt>
          <dd>{dateOfBirth}</dd>
        </div>
        <div>
          <dt>Mulank / Bhagyank</dt>
          <dd>{calibration?.mulank} / {calibration?.bhagyank}</dd>
        </div>
        <div>
          <dt>Zodiac</dt>
          <dd>{calibration?.zodiac?.sign} · {calibration?.zodiac?.bead?.name}</dd>
        </div>
        {lines.map((l) => (
          <div key={l.beadId}>
            <dt>{l.name} × {l.quantity}</dt>
            <dd><Price value={l.subtotal} /></dd>
          </div>
        ))}
        <div>
          <dt>Base making</dt>
          <dd><Price value={quote.baseMakingPrice} /></dd>
        </div>
        <div>
          <dt>Charm · {charm?.name}</dt>
          <dd><Price value={quote.charmPrice} /></dd>
        </div>
        <div>
          <dt>Wrist</dt>
          <dd>{formatWristChoice(threadType, wristSize)}</dd>
        </div>
        <div className="bag-summary-total">
          <dt>Total</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>

      {calibration?.explanation && (
        <p className="mt-4 text-xs leading-relaxed text-lilac">{calibration.explanation}</p>
      )}

      <div className="bag-summary-actions">
        <PlaceOrderButton />
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" className="bag-summary-clear" onClick={goBack}>
            ← Charm
          </button>
          <button type="button" className="bag-summary-clear" onClick={() => setStep(3)}>
            Edit calibration
          </button>
        </div>
      </div>
    </article>
  );
}
