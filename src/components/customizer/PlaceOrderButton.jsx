import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';

export default function PlaceOrderButton({ className = 'w-full' }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const quote = useCustomizerQuote();
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const calibration = useCustomizerStore((s) => s.calibration);
  const toCartPayload = useCustomizerStore((s) => s.toCartPayload);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const addCustom = useCartStore((s) => s.addCustom);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function place() {
    setErr('');
    if (engravingName.trim().length < 2) {
      setErr('Enter the final name before placing the order.');
      return;
    }
    if (!calibration) {
      setErr('Calibrate the strand from your date of birth first.');
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
      {err && <p className="mb-3 text-sm text-red-300">{err}</p>}
      {quote.errors?.length > 0 && !err && (
        <p className="mb-3 text-xs text-lilac">{quote.errors.join(' ')}</p>
      )}
      <Button onClick={place} disabled={busy} className={className}>
        {busy ? 'Placing…' : 'Place order'}
      </Button>
    </div>
  );
}
