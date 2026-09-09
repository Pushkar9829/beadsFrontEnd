import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const fetchServer = useCartStore((s) => s.fetchServer);
  const amount = useCartStore((s) => s.items.reduce((n, i) => n + i.lineTotal, 0));
  const navigate = useNavigate();
  const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || {};
  const [form, setForm] = useState({
    contactName: user?.name || '',
    phone: user?.phone || def.phone || '',
    line1: def.line1 || '',
    line2: def.line2 || '',
    city: def.city || '',
    state: def.state || '',
    pincode: def.pincode || '',
    country: def.country || 'India',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (!items.length) {
    return <EmptyState title="Nothing to check out" body="Add a piece first." />;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        contactName: form.contactName,
        phone: form.phone,
        shippingAddress: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
      });
      await fetchServer();
      navigate(`/account?placed=${data.order.orderNumber}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell grid gap-8 py-8 md:grid-cols-2">
      <form onSubmit={submit} className="space-y-3">
        <h1 className="font-serif text-2xl gold-text">Checkout</h1>
        <p className="text-sm text-lilac">
          Payment will open in the next step — coming soon. This places a pending-payment order so fulfilment can be prepared.
        </p>
        {['contactName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode', 'country'].map((k) => (
          <label key={k} className="block text-xs uppercase tracking-widest text-gold">
            {k}
            <input
              required={k !== 'line2'}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              className="mt-1 w-full rounded-xl border border-gold/30 bg-surface px-3 py-2 text-ivory"
            />
          </label>
        ))}
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Placing…' : 'Place pending order'}</Button>
      </form>
      <aside className="h-fit rounded-2xl p-5 gold-border">
        <h2 className="font-serif text-xl">Summary</h2>
        <ul className="mt-4 space-y-2 text-sm text-lilac">
          {items.map((i) => (
            <li key={i._id} className="flex justify-between gap-3">
              <span>{i.snapshot?.name || i.snapshot?.engravingName || i.snapshot?.intention?.name || 'Custom bracelet'} × {i.quantity}</span>
              <Price value={i.lineTotal} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-gold/20 pt-3 font-serif text-xl text-gold">
          <span>Total</span>
          <Price value={amount} />
        </div>
      </aside>
    </div>
  );
}
