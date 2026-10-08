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
      <p className="nx-k mt-4">{labels.previewKicker}</p>
      <h2 className="nx-sum-t">{intention?.braceletName || intention?.name || layer?.name || purpose?.name || labels.customStrand}</h2>
      <p className="nx-note">
        {layer ? `${layer.modeLabel} · ${layer.name}` : purpose?.name || labels.selectionPending}
        {!layer && intention ? ` · ${intention.braceletName || intention.name}` : ''}
      </p>
      {/* Line-by-line prices fold away so the column stays shorter than the screen. */}
      {(quote.lines?.length || quote.packaging?.lines?.length) ? (
        <details className="nx-price-more">
          <summary>Price breakdown</summary>
          <dl className="nx-rows">
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
          </dl>
        </details>
      ) : null}
      <dl className="nx-rows">
        <div>
          <dt>{formatWristChoice(threadType, wristSize)}</dt>
          <dd>{quote.beadCount} {labels.beadsUnit}</dd>
        </div>
        <div className="is-total">
          <dt>{labels.liveTotal}</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>
      {!quote.valid && quote.errors?.length > 0 && (
        <p className="nx-bad mt-3">{quote.errors.join(' ')}</p>
      )}
      <div className="mt-4 flex justify-between gap-3">
        <button type="button" className="nx-mini" onClick={() => setStep(1)}>
          {labels.editSelection}
        </button>
        <button
          type="button"
          className="nx-mini"
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
      <div className="nx-sum nx-sum-fold">
        <button
          type="button"
          className="nx-sum-toggle nx-k"
          onClick={() => setPreviewOpen(!previewOpen)}
        >
          {labels.previewToggle}
          <ChevronDown className={`transition ${previewOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {previewOpen && <div className="nx-sum-fold-body">{body}</div>}
      </div>
    );
  }

  return <aside className="studio-preview nx-sum">{body}</aside>;
}
