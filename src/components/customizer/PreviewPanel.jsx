import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import BraceletPreview from '../../preview/BraceletScene';
import Price from '../ui/Price';
import Button from '../ui/Button';

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
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-xs uppercase tracking-widest text-gold">Selection</p>
        <p>{purpose?.name || 'Purpose pending'} {intention ? `· ${intention.name}` : ''}</p>
        {engravingName && <p className="text-gold">{engravingName}</p>}
        {calibration && (
          <p className="text-lilac">
            Mulank {calibration.mulank} · {calibration.zodiac?.sign || 'Zodiac pending'}
          </p>
        )}
        {quote.lines.map((l) => (
          <div key={l.beadId} className="flex justify-between text-lilac">
            <span>{l.name} × {l.quantity} · <Price value={l.pricePerBead} /> / bead</span>
            <span className="text-ivory"><Price value={l.subtotal} /></span>
          </div>
        ))}
        <div className="flex justify-between text-lilac">
          <span>{charm?.name} · {finish?.label}</span>
          <Price value={quote.charmPrice} />
        </div>
        <div className="flex justify-between text-lilac">
          <span>Wrist {wristSize}</span>
          <span>{quote.beadCount} / {config?.beadLimit} beads</span>
        </div>
        <div className="flex justify-between border-t border-gold/20 pt-2 font-serif text-lg text-gold">
          <span>Live total</span>
          <Price value={quote.total} />
        </div>
        {!quote.valid && quote.errors?.length > 0 && (
          <p className="text-xs text-red-300">{quote.errors.join(' ')}</p>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Edit</Button>
          <Button variant="ghost" className="flex-1" onClick={() => { clearBuild(); navigate('/customize'); }}>Clear</Button>
        </div>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="rounded-2xl bg-surface gold-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-xs uppercase tracking-widest text-gold"
          onClick={() => setPreviewOpen(!previewOpen)}
        >
          Bracelet preview <ChevronDown className={previewOpen ? 'rotate-180' : ''} size={16} />
        </button>
        {previewOpen && <div className="px-4 pb-4">{body}</div>}
      </div>
    );
  }

  return <aside className="sticky top-24 rounded-2xl bg-surface p-4 gold-border">{body}</aside>;
}
