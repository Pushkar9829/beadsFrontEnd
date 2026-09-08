import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import BraceletPreview from '../../preview/BraceletScene';
import Price from '../ui/Price';

export default function PreviewPanel({ mobile }) {
  const navigate = useNavigate();
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const quote = useCustomizerQuote();
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const config = useCustomizerStore((s) => s.config);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const setStep = useCustomizerStore((s) => s.setStep);
  const previewOpen = useCustomizerStore((s) => s.previewOpen);
  const setPreviewOpen = useCustomizerStore((s) => s.setPreviewOpen);
  const calibration = useCustomizerStore((s) => s.calibration);
  const engravingName = useCustomizerStore((s) => s.engravingName);

  const body = (
    <>
      <BraceletPreview
        lines={quote.lines}
        layout={calibration?.layout}
        wristSize={wristSize}
        finish={finish}
        compact={mobile}
      />
      <p className="bag-summary-kicker mt-4">Live strand</p>
      <h2 className="bag-summary-title gold-text">{engravingName || 'Untitled'}</h2>
      <p className="mt-1 text-sm text-lilac">
        {purpose?.name || 'Purpose pending'}
        {intention ? ` · ${intention.name}` : ''}
        {calibration ? ` · Mulank ${calibration.mulank}` : ''}
        {calibration?.zodiac?.sign ? ` · ${calibration.zodiac.sign}` : ''}
      </p>
      <dl className="bag-summary-rows">
        {(quote.lines || []).map((l) => (
          <div key={l.beadId}>
            <dt>{l.name} × {l.quantity}</dt>
            <dd><Price value={l.subtotal} /></dd>
          </div>
        ))}
        <div>
          <dt>{charm?.name} · {finish?.label}</dt>
          <dd><Price value={quote.charmPrice} /></dd>
        </div>
        <div>
          <dt>Wrist {wristSize}</dt>
          <dd>{quote.beadCount} / {config?.beadLimit} beads</dd>
        </div>
        <div className="bag-summary-total">
          <dt>Live total</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>
      {!quote.valid && quote.errors?.length > 0 && (
        <p className="mt-3 text-xs text-red-300">{quote.errors.join(' ')}</p>
      )}
      <div className="mt-4 flex justify-between gap-3">
        <button type="button" className="bag-summary-clear" onClick={() => setStep(1)}>
          Edit purpose
        </button>
        <button
          type="button"
          className="bag-summary-clear"
          onClick={() => {
            clearBuild();
            navigate('/customize');
          }}
        >
          Clear
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
          Bracelet preview
          <ChevronDown className={`transition ${previewOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {previewOpen && <div className="px-4 pb-4">{body}</div>}
      </div>
    );
  }

  return <aside className="studio-preview bag-summary">{body}</aside>;
}
