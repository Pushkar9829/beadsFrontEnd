// "Place order" (beeds_ecommerce StudioBuilderPage.jsx L2165-2186 on the review panel, L2337-2369 in the
// action bar). The caller passes the source class: `sb-order` (panel) or `sb-dock-next` (bar).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useStudioLabels } from '../../lib/studioTheme';

export default function PlaceOrderButton({ className = 'sb-order', showErrors = true }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const quote = useCustomizerQuote();
  const charm = useCustomizerStore((s) => s.charm);
  const toCartPayload = useCustomizerStore((s) => s.toCartPayload);
  const clearBuild = useCustomizerStore((s) => s.clearBuild);
  const addCustom = useCartStore((s) => s.addCustom);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const labels = useStudioLabels();

  async function place() {
    setErr('');
    if (!charm) {
      setErr(labels.charmMissing || 'Choose a charm before placing the order.');
      return;
    }
    setBusy(true);
    try {
      await addCustom(toCartPayload());
      clearBuild();
      if (user) navigate('/checkout');
      else navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } catch (e) {
      setErr(e.message || labels.orderFailed || 'Could not place the order.');
    } finally {
      setBusy(false);
    }
  }

  const message = err || (quote.errors?.length ? quote.errors.join(' ') : '');

  return (
    <>
      {showErrors && message && <p className="sb-order-err">{message}</p>}
      <button type="button" onClick={place} disabled={busy} className={className}>
        {busy ? labels.placingOrder || 'Placing order…' : labels.placeOrder || 'Place order'}
      </button>
    </>
  );
}
