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

const HINT = {
  1: 'Choose a purpose to continue.',
  2: 'Choose an intention and keep at least one crystal.',
  3: 'Choose day, month and year.',
  4: 'Zodiac beads are added on this step.',
  5: 'Enter a name of at least 2 letters.',
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

  const ready = {
    1: !!purpose,
    2: !!intention && pickedCount > 0,
    3: Boolean(dateOfBirth),
    4: !!calibration,
    5: engravingName.trim().length >= 2,
  }[step];

  if (step === 6) return null;

  const busy = advancing;

  return (
    <div className="studio-nav">
      {(stepError || (!ready && HINT[step])) && (
        <p className={`mb-3 w-full text-sm ${stepError ? 'text-red-300' : 'text-lilac'}`}>
          {stepError || HINT[step]}
        </p>
      )}
      <Button variant="ghost" onClick={goBack} disabled={step === 1 || busy}>
        Back
      </Button>
      <div className="flex items-center gap-4">
        <span className="text-sm text-lilac">
          {quote.beadCount || 0} / {config?.beadLimit || 18} · <Price value={quote.total} />
        </span>
        <Button onClick={goNext} disabled={busy}>
          {busy || (step === 3 && calibrating) ? 'Working…' : NEXT_LABEL[step]}
        </Button>
      </div>
    </div>
  );
}
