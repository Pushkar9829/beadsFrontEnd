// "LIVE STRAND RIGHT PANEL (STEPS 2..5)" — beeds_ecommerce StudioBuilderPage.jsx L2062-2258.
// The source shows a still image (or its SVG LiveStrandViewer on toggle) inside a 240px frame;
// the frontend keeps its WebGL bracelet inside the same frame. Classes: styles/atelier/studio.css.
import { useNavigate } from 'react-router-dom';
import { ChevronDown, RotateCw } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import BraceletPreview from '../../preview/BraceletScene';
import Price from '../ui/Price';
import { formatWristChoice } from '../../lib/format';
import { useStudioLabels } from '../../lib/studioTheme';

/** 3D strand visual container (source L2074-2146), shared with the review side panel. */
export function LiveStage({ compact }) {
  const quote = useCustomizerQuote();
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  return (
    <div className="sb-stage">
      <BraceletPreview lines={quote.lines} wristSize={wristSize} finish={finish} charm={charm} compact={compact} />
      <div className="sb-stage-hint" aria-hidden>
        <RotateCw size={10} />
        <span>Drag to turn</span>
      </div>
    </div>
  );
}

export default function PreviewPanel({ mobile }) {
  const navigate = useNavigate();
  const labels = useStudioLabels();
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const layer = useCustomizerStore((s) => s.layer);
  const quote = useCustomizerQuote();
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const setStep = useCustomizerStore((s) => s.setStep);
  const previewOpen = useCustomizerStore((s) => s.previewOpen);
  const setPreviewOpen = useCustomizerStore((s) => s.setPreviewOpen);
  const threadType = useCustomizerStore((s) => s.threadType);
  const config = useCustomizerStore((s) => s.config);

  // "Korean elastic thread · 6.5" (Free-size fit)" splits into the source's two rows.
  const wrist = formatWristChoice(threadType, wristSize, config?.threadTypes);
  const cut = wrist.indexOf(' (');
  const threadLine = cut > 0 ? wrist.slice(0, cut) : wrist;
  const fitLine = cut > 0 ? wrist.slice(cut + 1) : '';

  const body = (
    <>
      <LiveStage compact={mobile} />
      <div className="sb-live-k">{labels.previewKicker || 'Live strand'}</div>
      <h2 className="sb-live-t">{intention?.braceletName || intention?.name || layer?.name || purpose?.name || labels.customStrand || 'Custom strand'}</h2>
      <div className="sb-live-s">
        {layer ? `${layer.modeLabel} · ${layer.name}` : purpose?.name || labels.selectionPending || ''}
        {!layer && intention ? ` · ${intention.braceletName || intention.name}` : ''}
      </div>
      <div className="sb-live-pb">
        <div className="sb-live-pb-k">Price breakdown</div>
        <div className="sb-live-r1">
          <span>{threadLine}</span>
          <span>{quote.beadCount || 0}</span>
        </div>
        <div className="sb-live-r2">
          <span>{fitLine}</span>
          <span>{labels.beadsUnit || 'beads'}</span>
        </div>
      </div>
      <div className="sb-live-total">
        <span>{labels.liveTotal || 'Live total'}</span>
        <b>
          <Price value={quote.total} />
        </b>
      </div>
      {!quote.valid && quote.errors?.length > 0 && <p className="sb-live-err">{quote.errors.join(' ')}</p>}
      <div className="sb-live-a">
        <button type="button" onClick={() => setStep(1)}>
          {labels.editSelection || 'Edit selection'}
        </button>
        <button
          type="button"
          onClick={() => {
            clearBuild();
            navigate('/customize');
          }}
        >
          {labels.clearBuild || 'Clear'}
        </button>
      </div>
    </>
  );

  if (mobile) {
    // Frontend-only: below 1024px the panel folds above the step (the source has no phone layout).
    return (
      <div className="sb-panel sb-live">
        <button type="button" className="sb-fold-t" onClick={() => setPreviewOpen(!previewOpen)} aria-expanded={previewOpen}>
          {labels.previewToggle || 'Live strand'}
          <ChevronDown size={16} className={`sb-fold-ic${previewOpen ? ' is-open' : ''}`} />
        </button>
        {previewOpen && <div className="sb-fold-b">{body}</div>}
      </div>
    );
  }

  return <aside className="sb-panel sb-live">{body}</aside>;
}
