import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import Button from '../ui/Button';
import Price from '../ui/Price';

const NEXT_LABEL = {
  1: 'Next · intention',
  2: 'Next · date of birth',
  3: 'Calibrate & continue',
  4: 'Next · name',
  5: 'Review & order',
};

export default function WizardNav() {
  const step = useCustomizerStore((s) => s.step);
  const goBack = useCustomizerStore((s) => s.goBack);
  const goNext = useCustomizerStore((s) => s.goNext);
  const advancing = useCustomizerStore((s) => s.advancing);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const stepError = useCustomizerStore((s) => s.stepError);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const calibration = useCustomizerStore((s) => s.calibration);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const quote = useCustomizerQuote();
  const config = useCustomizerStore((s) => s.config);
  const pickedCount = recommended.filter((b) => (quantities[b._id] || 0) > 0).length;

  const canNext = {
    1: !!purpose,
    2: !!intention && pickedCount > 0,
    3: Boolean(dateOfBirth),
    4: !!calibration,
    5: engravingName.trim().length >= 2,
  }[step];

  if (step === 6) return null;

  const busy = advancing || calibrating;

  return (
    <div className="mt-8 border-t border-gold/20 pt-4">
      {stepError && <p className="mb-3 text-sm text-red-300">{stepError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={goBack} disabled={step === 1 || busy}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-lilac sm:inline">
            {quote.beadCount} / {config?.beadLimit || 18} · <Price value={quote.total} />
          </span>
          <Button onClick={goNext} disabled={!canNext || busy}>
            {busy ? 'Working…' : NEXT_LABEL[step]}
          </Button>
        </div>
      </div>
    </div>
  );
}
