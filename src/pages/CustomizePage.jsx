import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomizerStore, selectUrlQuery } from '../store/customizerStore';
import { stepAt, stepCopy } from '../lib/studioFlow';
import { studioMode } from '../lib/studioModes';
import Stepper from '../components/customizer/Stepper';
import StudioDock from '../components/customizer/StudioDock';
import ChooseStep from '../components/customizer/steps/ChooseStep';
import CrystalPicker from '../components/customizer/CrystalPicker';
import FitStep from '../components/customizer/steps/FitStep';
import FinishStep from '../components/customizer/steps/FinishStep';
import ReviewStep from '../components/customizer/ReviewStep';
import PreviewPanel from '../components/customizer/PreviewPanel';
import BeadDetailDrawer from '../components/customizer/BeadDetailDrawer';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { studioThemeStyle } from '../lib/studioTheme';

const PANE = {
  choose: ChooseStep,
  crystals: CrystalPicker,
  fit: FitStep,
  finish: FinishStep,
  review: ReviewStep,
};

export default function CustomizePage() {
  const brand = useBrand();
  const cmsCustomize = useSite().pages.customize;
  const cmsSteps = cmsCustomize.steps || [];
  const themeStyle = studioThemeStyle(cmsCustomize.theme);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const syncFromUrl = useCustomizerStore((s) => s.syncFromUrl);
  const canonical = useCustomizerStore(selectUrlQuery);
  const urlSyncing = useCustomizerStore((s) => s.urlSyncing);
  const loading = useCustomizerStore((s) => s.loading);
  const error = useCustomizerStore((s) => s.error);
  const step = useCustomizerStore((s) => s.step);
  const path = useCustomizerStore((s) => s.path);
  const config = useCustomizerStore((s) => s.config);
  const layer = useCustomizerStore((s) => s.layer);
  const purpose = useCustomizerStore((s) => s.purpose);
  const search = params.toString();

  // The only place URL params become state. The store decides what changed, so this
  // effect stays a single pass instead of a web of guards.
  useEffect(() => {
    syncFromUrl(new URLSearchParams(search));
  }, [search, syncFromUrl]);

  // Mirror the selection back into the address bar so the build is shareable. This runs in
  // the same commit as the sync above, so the rendered `canonical` and `urlSyncing` still
  // describe the previous selection; both are re-read fresh here. Without that, the two
  // effects volley the address bar between the old path and the new one. They stay in the
  // dependency list only to re-run this once the hydration lands.
  useEffect(() => {
    const state = useCustomizerStore.getState();
    if (state.urlSyncing) return;
    const fresh = selectUrlQuery(state);
    if (fresh && fresh !== search) navigate(`/customize?${fresh}`, { replace: true });
  }, [urlSyncing, canonical, search, navigate]);

  const mode = studioMode(path, config);
  const copy = stepCopy(step, cmsSteps);
  const entry = stepAt(step);
  // The path chips no longer sit above the flow, so step one names the path itself.
  // An admin-authored eyebrow still wins.
  const eyebrow =
    step === 1 && copy.eyebrow === entry.eyebrow ? `Step 01 · ${mode.short}` : copy.eyebrow;
  const Pane = PANE[entry.id];
  const selectionName = layer?.name || purpose?.name || '';

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

  return (
    <div className="studio-page relative pb-36 lg:pb-0" style={themeStyle}>
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <SeoHead
          title={pageTitle(copy.title || brand.nav.customize, brand)}
          description={copy.body || mode.body}
          keywords={brand.seo?.keywords}
          image={brand.seo?.ogImage}
          noIndex={brand.seo?.noIndex}
        />
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: brand.nav.customize, to: '/customize' },
            { label: mode.short },
          ]}
        />

        <div className="studio-head">
          <SectionHead
            eyebrow={eyebrow}
            title={copy.title}
            body={selectionName && step > 1 ? `${mode.short} · ${selectionName}` : copy.body}
          />
        </div>
        <Stepper />

        <div className="mt-6 lg:hidden">
          <PreviewPanel mobile />
        </div>

        <div className="studio-stage">
          <div className="studio-pane">
            {Pane ? <Pane /> : null}
            <StudioDock />
          </div>
          <div className="hidden lg:block">
            <PreviewPanel />
          </div>
        </div>
      </div>
      <BeadDetailDrawer />
    </div>
  );
}
