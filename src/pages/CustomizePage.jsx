import { useEffect, useRef, useState } from 'react';
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
import StudioModeNav from '../components/customizer/StudioModeNav';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';

export default function CustomizePage() {
  const steps = useSite().pages.customize.steps || [];
  const brand = useBrand();
  const intro = steps[0] || {};
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const appliedSlug = useRef('');
  const hydratedLayer = useRef('');
  const init = useCustomizerStore((s) => s.init);
  const purposes = useCustomizerStore((s) => s.purposes);
  const purpose = useCustomizerStore((s) => s.purpose);
  const layer = useCustomizerStore((s) => s.layer);
  const recommended = useCustomizerStore((s) => s.recommended);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const hydrateLayerFromQuery = useCustomizerStore((s) => s.hydrateLayerFromQuery);
  const setStep = useCustomizerStore((s) => s.setStep);
  const loading = useCustomizerStore((s) => s.loading);
  const error = useCustomizerStore((s) => s.error);
  const step = useCustomizerStore((s) => s.step);
  const quote = useCustomizerQuote();
  const goNext = useCustomizerStore((s) => s.goNext);
  const goBack = useCustomizerStore((s) => s.goBack);
  const advancing = useCustomizerStore((s) => s.advancing);
  const stepError = useCustomizerStore((s) => s.stepError);
  const charm = useCustomizerStore((s) => s.charm);
  const threadType = useCustomizerStore((s) => s.threadType);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const [bootingLayer, setBootingLayer] = useState(() => Boolean(params.get('layer') && params.get('key')));
  const copy = steps[step - 1] || intro;
  const crumbs = [
    { label: 'Home', to: '/' },
    { label: brand.nav.customize, to: '/customize' },
  ];
  if (layer) {
    crumbs.push({ label: layer.modeLabel, to: layer.path });
    crumbs.push({ label: layer.name });
  }

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const kind = params.get('layer');
    const key = params.get('key');
    const token = `${kind || ''}:${key || ''}:${params.get('mulank') || ''}:${params.get('bhagyank') || ''}:${params.get('dob') || ''}`;
    if (!kind || !key) {
      hydratedLayer.current = '';
      setBootingLayer(false);
      return;
    }
    const already =
      layer?.kind === kind &&
      String(layer?.key) === String(key) &&
      (recommended || []).length > 0;
    if (already || hydratedLayer.current === token) {
      setBootingLayer(false);
      return;
    }
    let cancelled = false;
    setBootingLayer(true);
    Promise.resolve(
      hydrateLayerFromQuery({
        kind,
        key,
        mulank: params.get('mulank'),
        bhagyank: params.get('bhagyank'),
        dateOfBirth: params.get('dob'),
      })
    ).finally(() => {
      hydratedLayer.current = token;
      if (!cancelled) setBootingLayer(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params, hydrateLayerFromQuery, layer, recommended]);

  useEffect(() => {
    if (layer && step < 5) setStep(5);
  }, [layer, step, setStep]);

  useEffect(() => {
    const slug = params.get('purpose');
    if (params.get('layer') || layer) return;
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
  }, [params, purposes, purpose, selectPurpose, layer]);

  useEffect(() => {
    if (layer) {
      if (params.get('layer') === layer.kind && params.get('key') === String(layer.key)) return;
      const q = new URLSearchParams({ layer: layer.kind, key: String(layer.key) });
      if (layer.mulank) q.set('mulank', String(layer.mulank));
      if (layer.bhagyank) q.set('bhagyank', String(layer.bhagyank));
      navigate(`/customize?${q.toString()}`, { replace: true });
      return;
    }
    if (!purpose?.slug || !purpose._id) return;
    if (params.get('purpose') === purpose.slug) return;
    appliedSlug.current = purpose.slug;
    navigate(`/customize?purpose=${purpose.slug}`, { replace: true });
  }, [purpose, params, navigate, layer]);

  const layerReady =
    !!charm && (threadType !== 'steel-core' || Boolean(wristSize));

  if (loading || bootingLayer) {
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

  if (params.get('layer') && !layer) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell py-10 text-center">
          <p className="text-sm text-red-300">{stepError || 'That combination could not be opened.'}</p>
          <div className="mt-6">
            <Button to={params.get('layer') ? `/customize/${params.get('layer')}` : '/customize'}>
              Back to selection
            </Button>
          </div>
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
        <SeoHead
          title={pageTitle(copy.title || brand.nav.customize, brand)}
          description={copy.body || intro.body}
          keywords={brand.seo?.keywords}
          image={brand.seo?.ogImage}
          noIndex={brand.seo?.noIndex}
        />
        <Breadcrumbs items={crumbs} />

        <div className="studio-head">
          <SectionHead
            eyebrow={layer ? layer.modeLabel : copy.eyebrow}
            title={layer && step >= 5 ? `${layer.name}` : copy.title}
            body={layer ? (layer.theme || copy.body) : copy.body}
          />
        </div>
        {!layer && <StudioModeNav />}

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
            onClick={() => {
              if (layer && step === 5) navigate(layer.path);
              else goBack();
            }}
            disabled={(!layer && step === 1) || advancing}
          >
            Back
          </button>
          <span className="font-serif text-lg text-gold">
            <Price value={quote.total} />
          </span>
          {step < 6 ? (
            <Button onClick={goNext} disabled={advancing || (layer && !layerReady)} className="px-4! py-2!">
              {advancing ? '…' : layer && step === 5 ? 'Review & order' : 'Next'}
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
