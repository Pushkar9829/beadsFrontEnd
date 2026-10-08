import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomizerStore, selectUrlQuery } from '../store/customizerStore';
import { stepAt, stepCopy } from '../lib/studioFlow';
import { studioMode } from '../lib/studioModes';
import Stepper from '../components/customizer/Stepper';
import StudioDock from '../components/customizer/StudioDock';
import PurposePick from '../components/customizer/steps/PurposePick';
import IntentionStep from '../components/customizer/steps/IntentionStep';
import PurposeBirth from '../components/customizer/steps/PurposeBirth';
import StudioChoose from '../components/customizer/steps/StudioChoose';
import StudioCrystals from '../components/customizer/steps/StudioCrystals';
import StudioBeads from '../components/customizer/steps/StudioBeads';
import StudioCharm from '../components/customizer/steps/StudioCharm';
import StudioReview, { ReviewSide } from '../components/customizer/steps/StudioReview';
import StudioPaths from '../components/customizer/StudioPaths';
import StudioGuide from '../components/customizer/StudioGuide';
import PreviewPanel from '../components/customizer/PreviewPanel';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { GridSkeleton, PageIntro } from '../components/home/nocturne/Listing';

// One screen per step id (see lib/studioFlow.js for the order on each path).
const PANE = {
  purpose: PurposePick,
  intention: IntentionStep,
  birth: PurposeBirth,
  choose: StudioChoose,
  crystals: StudioCrystals,
  beads: StudioBeads,
  charm: StudioCharm,
  review: StudioReview,
};

export default function CustomizePage() {
  const brand = useBrand();
  const cmsSteps = useSite().pages.customize?.steps || [];
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
  const copy = stepCopy(step, cmsSteps, path);
  const entry = stepAt(step, path);
  const Pane = PANE[entry.id];
  const selectionName = layer?.name || purpose?.name || '';

  if (loading || error) {
    return (
      <div className="nx nx-page nx-studio">
        <PageIntro compact title={copy.title} />
        {error ? (
          <div className="nx-w nx-sec">
            <p className="nx-error">{error}</p>
          </div>
        ) : (
          <GridSkeleton n={8} />
        )}
      </div>
    );
  }

  return (
    <div className="nx nx-page nx-studio">
      <SeoHead
        title={pageTitle(copy.title || brand.nav.customize, brand)}
        description={copy.body || mode.body}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage}
        noIndex={brand.seo?.noIndex}
      />
      <PageIntro compact title={copy.title} body={selectionName && step > 1 ? `${mode.short} · ${selectionName}` : copy.body} />
      <div className="nx-w nx-studio-body">
        {step === 1 && <StudioPaths />}
        <Stepper />
        {step > 1 && (
          <div className="mt-6 lg:hidden">
            <PreviewPanel mobile />
          </div>
        )}
        <div className="studio-stage">
          <div className="studio-pane">
            {Pane ? <Pane /> : null}
            <StudioDock />
          </div>
          <div className="hidden lg:block">{step === 1 ? <StudioGuide /> : entry.id === 'review' ? <ReviewSide /> : <PreviewPanel />}</div>
        </div>
      </div>
    </div>
  );
}
