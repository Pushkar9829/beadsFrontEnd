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
import PlaceOrderButton from '../components/customizer/PlaceOrderButton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import { useSite } from '../store/contentStore';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Customization' },
];

export default function CustomizePage() {
  const steps = useSite().pages.customize.steps || [];
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
  const goNext = useCustomizerStore((s) => s.goNext);
  const goBack = useCustomizerStore((s) => s.goBack);
  const advancing = useCustomizerStore((s) => s.advancing);
  const stepError = useCustomizerStore((s) => s.stepError);
  const copy = steps[step - 1] || steps[0] || {};

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

  if (loading) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell py-10">
          <Spinner label="Opening the atelier" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell py-10">
          <p className="text-center text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const pane = {
    1: <PurposeGrid />,
    2: <IntentionGrid />,
    3: <BirthDateStep />,
    4: <ZodiacStep />,
    5: <NameStep />,
    6: <ReviewStep />,
  }[step];

  return (
    <div className="studio-page relative pb-28">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="studio-head">
          <SectionHead eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
        </div>

        <Stepper />

        <div className="mt-6 lg:hidden">
          <PreviewPanel mobile />
        </div>

        <div className="studio-stage">
          <div className="studio-pane">
            {pane}
            {stepError && <p className="mt-4 text-sm text-red-300 lg:hidden">{stepError}</p>}
            <WizardNav />
          </div>
          <div className="hidden lg:block">
            <PreviewPanel />
          </div>
        </div>
      </div>

      <div className="studio-dock">
        <div className="shell flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-xs uppercase tracking-[0.16em] text-lilac disabled:opacity-40"
            onClick={goBack}
            disabled={step === 1 || advancing}
          >
            Back
          </button>
          <span className="font-serif text-lg text-gold">
            <Price value={quote.total} />
          </span>
          {step < 6 ? (
            <Button onClick={goNext} disabled={advancing} className="px-4! py-2!">
              {advancing ? '…' : 'Next'}
            </Button>
          ) : (
            <div className="min-w-0 shrink-0">
              <PlaceOrderButton className="px-4! py-2!" />
            </div>
          )}
        </div>
      </div>
      <BeadDetailDrawer />
    </div>
  );
}
