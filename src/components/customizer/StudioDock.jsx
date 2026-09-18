import {
  useCustomizerStore,
  useCustomizerQuote,
  selectCanAdvance,
  selectStepHint,
} from '../../store/customizerStore';
import { REVIEW_STEP, STEP_COUNT, stepAt } from '../../lib/studioFlow';
import Button from '../ui/Button';
import Price from '../ui/Price';
import PlaceOrderButton from './PlaceOrderButton';

const NEXT_LABEL = {
  choose: 'Next · crystals',
  crystals: 'Next · fit',
  fit: 'Next · finish',
  finish: 'Review',
};

export default function StudioDock() {
  const step = useCustomizerStore((s) => s.step);
  const goBack = useCustomizerStore((s) => s.goBack);
  const goNext = useCustomizerStore((s) => s.goNext);
  const stepError = useCustomizerStore((s) => s.stepError);
  const canAdvance = useCustomizerStore(selectCanAdvance);
  const hint = useCustomizerStore(selectStepHint);
  const quote = useCustomizerQuote();
  const entry = stepAt(step);
  const message = stepError || hint;

  return (
    <div className="studio-actions">
      <div className="studio-actions-shell">
        {message ? (
          <p className={`studio-actions-hint ${stepError ? 'is-error' : ''}`}>{message}</p>
        ) : null}
        <div className="studio-actions-row">
          <button
            type="button"
            className="studio-actions-back"
            onClick={goBack}
            disabled={step === 1}
          >
            Back
          </button>
          <span className="studio-actions-meta">
            <span>
              Step {step} of {STEP_COUNT}
            </span>
            <strong>
              {quote.beadCount || 0} beads · <Price value={quote.total} />
            </strong>
          </span>
          {step < REVIEW_STEP ? (
            <Button onClick={goNext} disabled={!canAdvance} className="studio-actions-next">
              {NEXT_LABEL[entry.id] || 'Next'}
            </Button>
          ) : null}
        </div>
        {step >= REVIEW_STEP ? (
          <div className="mt-3">
            <PlaceOrderButton className="w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
