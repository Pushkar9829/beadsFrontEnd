import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import BraceletPreview from '../../preview/BraceletScene';
import Price from '../ui/Price';
import { formatWristChoice } from '../../lib/format';
import { useStudioLabels } from '../../lib/studioTheme';

export default function PreviewPanel({ mobile }) {
  const navigate = useNavigate();
  const labels = useStudioLabels();
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const layer = useCustomizerStore((s) => s.layer);
  const quote = useCustomizerQuote();
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const setStep = useCustomizerStore((s) => s.setStep);
  const previewOpen = useCustomizerStore((s) => s.previewOpen);
  const setPreviewOpen = useCustomizerStore((s) => s.setPreviewOpen);
  const threadType = useCustomizerStore((s) => s.threadType);

  const body = (
    <>
      <BraceletPreview
        lines={quote.lines}
        wristSize={wristSize}
        finish={finish}
        charm={charm}
        compact={mobile}
      />
      <p className="bag-summary-kicker mt-4">{labels.previewKicker}</p>
      <h2 className="bag-summary-title gold-text">{intention?.braceletName || intention?.name || layer?.name || purpose?.name || labels.customStrand}</h2>
      <p className="mt-1 text-sm text-lilac">
        {layer ? `${layer.modeLabel} · ${layer.name}` : purpose?.name || labels.selectionPending}
        {!layer && intention ? ` · ${intention.braceletName || intention.name}` : ''}
      </p>
      <dl className="bag-summary-rows">
        {(quote.lines || []).map((l) => (
          <div key={l.beadId}>
            <dt>{l.name} × {l.quantity}</dt>
            <dd><Price value={l.subtotal} /></dd>
          </div>
        ))}
        {(quote.packaging?.lines || []).map((row) => (
          <div key={row.key}>
            <dt>{row.label}</dt>
            <dd><Price value={row.amount} /></dd>
          </div>
        ))}
        <div>
          <dt>{formatWristChoice(threadType, wristSize)}</dt>
          <dd>{quote.beadCount} {labels.beadsUnit}</dd>
        </div>
        <div className="bag-summary-total">
          <dt>{labels.liveTotal}</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>
      {!quote.valid && quote.errors?.length > 0 && (
        <p className="mt-3 text-xs text-red-300">{quote.errors.join(' ')}</p>
      )}
      <div className="mt-4 flex justify-between gap-3">
        <button type="button" className="bag-summary-clear" onClick={() => setStep(1)}>
          {labels.editSelection}
        </button>
        <button
          type="button"
          className="bag-summary-clear"
          onClick={() => {
            clearBuild();
            navigate('/customize');
          }}
        >
          {labels.clearBuild}
        </button>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="auth-card !p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3.5 text-[11px] uppercase tracking-[0.2em] text-gold"
          onClick={() => setPreviewOpen(!previewOpen)}
        >
          {labels.previewToggle}
          <ChevronDown className={`transition ${previewOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {previewOpen && <div className="px-4 pb-4">{body}</div>}
      </div>
    );
  }

  return <aside className="studio-preview bag-summary">{body}</aside>;
}
