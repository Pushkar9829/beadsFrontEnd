import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Price from '../ui/Price';

export default function ReviewStep() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intention = useCustomizerStore((s) => s.intention);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const calibration = useCustomizerStore((s) => s.calibration);
  const quote = useCustomizerQuote();
  const goBack = useCustomizerStore((s) => s.goBack);
  const setStep = useCustomizerStore((s) => s.setStep);
  const toCartPayload = useCustomizerStore((s) => s.toCartPayload);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const addCustom = useCartStore((s) => s.addCustom);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function place() {
    setErr('');
    if (!quote.valid) {
      setErr((quote.errors || []).join(' ') || 'Complete every step before ordering.');
      return;
    }
    if (engravingName.trim().length < 2) {
      setErr('Enter the final name before placing the order.');
      return;
    }
    setBusy(true);
    try {
      await addCustom(toCartPayload());
      clearBuild();
      if (user) navigate('/checkout');
      else navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } catch (e) {
      setErr(e.message || 'Could not place this piece.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="text" onClick={goBack}>← Name</Button>
      <h2 className="mt-2 font-serif text-2xl gold-text">Review & order</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Name</dt>
          <dd>{engravingName}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Intention</dt>
          <dd>{purpose?.name} · {intention?.name}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Date of birth</dt>
          <dd>{dateOfBirth}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Mulank / Bhagyank</dt>
          <dd>{calibration?.mulank} / {calibration?.bhagyank}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
          <dt className="text-lilac">Zodiac</dt>
          <dd>{calibration?.zodiac?.sign} · {calibration?.zodiac?.bead?.name}</dd>
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
        <div className="flex justify-between font-serif text-xl text-gold">
          <dt>Total</dt>
          <dd><Price value={quote.total} /></dd>
        </div>
      </dl>
      {calibration?.explanation && (
        <p className="mt-4 text-xs leading-relaxed text-lilac">{calibration.explanation}</p>
      )}
      {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={place} disabled={busy}>{busy ? 'Placing…' : 'Place order'}</Button>
        <Button variant="ghost" onClick={() => setStep(3)}>Edit calibration</Button>
      </div>
    </div>
  );
}
