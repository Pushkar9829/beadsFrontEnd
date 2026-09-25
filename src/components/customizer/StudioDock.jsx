import {
  useCustomizerStore,
  useCustomizerQuote,
  selectCanAdvance,
  selectStepHint,
} from '../../store/customizerStore';
import { stepAt, stepCountFor } from '../../lib/studioFlow';
import Button from '../ui/Button';
import Price from '../ui/Price';
import PlaceOrderButton from './PlaceOrderButton';
import { studioText, useStudioLabels } from '../../lib/studioTheme';

const NEXT_LABEL_KEY = {
  choose: 'nextChoose',
  crystals: 'nextCrystals',
  fit: 'nextFit',
  finish: 'nextFinish',
};

export default function StudioDock() {
  const step = useCustomizerStore((s) => s.step);
  const path = useCustomizerStore((s) => s.path);
  const advancing = useCustomizerStore((s) => s.advancing);
  const goBack = useCustomizerStore((s) => s.goBack);
  const goNext = useCustomizerStore((s) => s.goNext);
  const stepError = useCustomizerStore((s) => s.stepError);
  const canAdvance = useCustomizerStore(selectCanAdvance);
  const hint = useCustomizerStore(selectStepHint);
  const quote = useCustomizerQuote();
  const labels = useStudioLabels();
  const total = stepCountFor(path);
  const entry = stepAt(step, path);
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
            {labels.backLabel}
          </button>
          <span className="studio-actions-meta">
            <span>{studioText(labels, 'stepCounter', { step, total })}</span>
            <strong>
              {quote.beadCount || 0} {labels.beadsUnit} · <Price value={quote.total} />
            </strong>
          </span>
          {step < total ? (
            <Button onClick={goNext} disabled={!canAdvance || advancing} className="studio-actions-next">
              {advancing ? '…' : (labels[NEXT_LABEL_KEY[entry.id]] || 'Next')}
            </Button>
          ) : null}
        </div>
        {step >= total ? (
          <div className="mt-3">
            <PlaceOrderButton className="w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
