import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { useCartStore } from '../../store/cartStore';
import Button from '../ui/Button';
import Price from '../ui/Price';

export default function ReviewStep() {
  const navigate = useNavigate();
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const quote = useCustomizerQuote();
  const setStep = useCustomizerStore((s) => s.setStep);
  const toCartPayload = useCustomizerStore((s) => s.toCartPayload);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const addCustom = useCartStore((s) => s.addCustom);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function add() {
    setErr('');
    if (!quote.valid) {
      setErr(quote.errors.join(' '));
      return;
    }
    setBusy(true);
    try {
      await addCustom(toCartPayload());
      clearBuild();
      navigate('/cart');
    } catch (e) {
      setErr(e.message || 'Could not add to cart.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="text" onClick={() => setStep(4)}>← Charm</Button>
      <h2 className="mt-2 font-serif text-2xl gold-text">Review & order</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Intention</dt>
          <dd>{purpose?.name} · {intention?.name}</dd>
        </div>
        {quote.lines.map((l) => (
          <div key={l.beadId} className="flex justify-between gap-4 border-b border-white/10 pb-2">
            <dt className="text-lilac">{l.name} × {l.quantity}</dt>
            <dd><Price value={l.subtotal} /></dd>
          </div>
        ))}
        <div className="flex justify-between text-lilac">
          <dt>Base making</dt>
          <dd><Price value={quote.baseMakingPrice} /></dd>
        </div>
        <div className="flex justify-between text-lilac">
          <dt>{charm?.name} · {finish?.label}</dt>
          <dd><Price value={quote.charmPrice} /></dd>
        </div>
        <div className="flex justify-between text-lilac">
          <dt>Wrist size</dt>
          <dd>{wristSize}</dd>
        </div>
        <div className="flex justify-between text-lilac">
          <dt>Beads</dt>
          <dd>{quote.beadCount}</dd>
        </div>
        <div className="flex justify-between font-serif text-xl text-gold">
          <dt>Total</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>
      {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add to cart'}</Button>
        <Button variant="ghost" onClick={() => setStep(3)}>Edit beads</Button>
      </div>
    </div>
  );
}
