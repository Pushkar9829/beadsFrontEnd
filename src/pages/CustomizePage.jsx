import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomizerStore, useCustomizerQuote } from '../store/customizerStore';
import Stepper from '../components/customizer/Stepper';
import WizardNav from '../components/customizer/WizardNav';
import PurposeGrid from '../components/customizer/PurposeGrid';
import IntentionGrid from '../components/customizer/IntentionGrid';
import BirthDateStep from '../components/customizer/BirthDateStep';
import ZodiacStep from '../components/customizer/ZodiacStep';
import NameStep from '../components/customizer/NameStep';
import ReviewStep from '../components/customizer/ReviewStep';
import PreviewPanel from '../components/customizer/PreviewPanel';
import BeadDetailDrawer from '../components/customizer/BeadDetailDrawer';
import Spinner from '../components/ui/Spinner';
import Price from '../components/ui/Price';
import Button from '../components/ui/Button';

export default function CustomizePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const appliedSlug = useRef('');
  const init = useCustomizerStore((s) => s.init);
  const purposes = useCustomizerStore((s) => s.purposes);
  const purpose = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const loading = useCustomizerStore((s) => s.loading);
  const error = useCustomizerStore((s) => s.error);
  const step = useCustomizerStore((s) => s.step);
  const quote = useCustomizerQuote();
  const config = useCustomizerStore((s) => s.config);
  const goNext = useCustomizerStore((s) => s.goNext);
  const goBack = useCustomizerStore((s) => s.goBack);
  const advancing = useCustomizerStore((s) => s.advancing);
  const calibrating = useCustomizerStore((s) => s.calibrating);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const calibration = useCustomizerStore((s) => s.calibration);
  const pickedCount = recommended.filter((b) => (quantities[b._id] || 0) > 0).length;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const slug = params.get('purpose');
    if (!slug || !purposes.length) return;
    if (purpose?.slug === slug) {
      appliedSlug.current = slug;
      return;
    }
    if (appliedSlug.current === slug) return;
    const match = purposes.find((p) => p.slug === slug);
    if (!match) return;
    appliedSlug.current = slug;
    selectPurpose(match);
  }, [params, purposes, purpose, selectPurpose]);

  useEffect(() => {
    if (!purpose?.slug) return;
    if (params.get('purpose') === purpose.slug) return;
    appliedSlug.current = purpose.slug;
    navigate(`/customize?purpose=${purpose.slug}`, { replace: true });
  }, [purpose, params, navigate]);

  if (loading) return <Spinner label="Opening the atelier" />;
  if (error) return <p className="p-8 text-center text-red-300">{error}</p>;

  const pane = {
    1: <PurposeGrid />,
    2: <IntentionGrid />,
    3: <BirthDateStep />,
    4: <ZodiacStep />,
    5: <NameStep />,
    6: <ReviewStep />,
  }[step];

  const mobileCanNext = {
    1: !!purpose,
    2: !!intention && pickedCount > 0,
    3: Boolean(dateOfBirth),
    4: !!calibration,
    5: engravingName.trim().length >= 2,
  }[step];

  return (
    <div className="shell py-8 pb-28 lg:pb-8">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Customization</p>
      <h1 className="mt-2 font-serif text-3xl gold-text md:text-4xl">Customization</h1>
      <p className="mt-2 max-w-2xl text-lilac">
        Purpose, intention, date of birth, zodiac beads, then a name. Each step builds the bracelet you will order.
      </p>
      <div className="mt-6">
        <Stepper />
      </div>

      <div className="mt-8 lg:hidden">
        <PreviewPanel mobile />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {pane}
          <WizardNav />
        </div>
        <div className="hidden lg:block">
          <PreviewPanel />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="shell flex items-center justify-between gap-3 text-sm">
          <button type="button" className="text-lilac" onClick={goBack} disabled={step === 1}>
            Back
          </button>
          <span className="font-serif text-lg text-gold"><Price value={quote.total} /></span>
          {step < 6 ? (
            <Button
              onClick={goNext}
              disabled={!mobileCanNext || advancing || calibrating}
              className="!px-4 !py-2"
            >
              {advancing || calibrating ? '…' : 'Next'}
            </Button>
          ) : (
            <span className="text-xs uppercase tracking-widest text-lilac">
              {quote.beadCount}/{config?.beadLimit}
            </span>
          )}
        </div>
      </div>
      <BeadDetailDrawer />
    </div>
  );
}
