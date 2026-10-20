// "BOTTOM STICKY ACTION BAR" — beeds_ecommerce StudioBuilderPage.jsx L2268-2371: helper text on the
// left; Back, the step counter with the live beads · price, and Next (Place order on the last step).
// Classes: styles/atelier/studio-dock.css.
import {
  useCustomizerStore,
  useCustomizerQuote,
  selectCanAdvance,
  selectStepHint,
} from '../../store/customizerStore';
import { flowFor, stepAt, stepCountFor } from '../../lib/studioFlow';
import Price from '../ui/Price';
import PlaceOrderButton from './PlaceOrderButton';
import { studioText, useStudioLabels } from '../../lib/studioTheme';

const NEXT_LABEL_KEY = {
  choose: 'nextChoose',
  crystals: 'nextCrystals',
};

// The source's helper line once a step is complete (L2287-2296).
const DONE_HINT = {
  birth: 'Adjust beads or proceed.',
  crystals: 'Adjust beads or proceed.',
  beads: 'Adjust beads or proceed.',
  charm: 'Confirm charm & thread.',
  review: 'Review your consecrated strand.',
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
  // Steps without an admin label name the step they lead to ("Next · Intention").
  const upcoming = flowFor(path)[step]?.label;
  const message = stepError || hint || DONE_HINT[entry.id] || '';

  return (
    <div className="sb-dock">
      <div className={`sb-dock-hint${stepError ? ' is-error' : ''}`}>{message}</div>
      <div className="sb-dock-r">
        <button type="button" className="sb-dock-back" onClick={goBack} disabled={step === 1}>
          {labels.backLabel || 'Back'}
        </button>
        <div className="sb-dock-meta">
          <div className="sb-dock-step">{studioText(labels, 'stepCounter', { step, total }) || `Step ${step} of ${total}`}</div>
          <div className="sb-dock-v">
            {quote.beadCount || 0} {labels.beadsUnit || 'beads'} · <Price value={quote.total} />
          </div>
        </div>
        {step < total ? (
          <button type="button" onClick={goNext} disabled={!canAdvance || advancing} className="sb-dock-next">
            {advancing ? '…' : labels[NEXT_LABEL_KEY[entry.id]] || (upcoming ? `Next · ${upcoming}` : 'Next')}
          </button>
        ) : (
          <PlaceOrderButton className="sb-dock-next" showErrors={false} />
        )}
      </div>
    </div>
  );
}
