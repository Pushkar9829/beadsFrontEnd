import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';
import { useSite } from '../store/contentStore';
import { startCashfreeCheckout } from '../lib/cashfree';

export default function CheckoutPage() {
  const page = useSite().pages.checkout;
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const fetchServer = useCartStore((s) => s.fetchServer);
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
  const [quote, setQuote] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [method, setMethod] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!items.length) return;
    const qs = new URLSearchParams();
    if (form.pincode) qs.set('pincode', form.pincode);
    api.get(`/checkout/quote?${qs}`).then(({ data }) => {
      setQuote(data.quote);
      if (data.quote?.coupon?.code) setCoupon(data.quote.coupon.code);
      const payOpts = data.quote?.payment;
      if (payOpts) {
        setMethod((current) => {
          if (current === 'cod' && !payOpts.cod) return payOpts.gateway ? 'gateway' : payOpts.upi ? 'upi' : '';
          if (current === 'upi' && !payOpts.upi) return payOpts.gateway ? 'gateway' : payOpts.cod ? 'cod' : '';
          if (current === 'gateway' && !payOpts.gateway) return payOpts.cod ? 'cod' : payOpts.upi ? 'upi' : '';
          if (!current) return payOpts.cod ? 'cod' : payOpts.gateway ? 'gateway' : payOpts.upi ? 'upi' : '';
          return current;
        });
      }
    }).catch(() => {});
  }, [items.length, form.pincode]);

  if (!items.length) {
    return <EmptyState title={page.emptyTitle} body={page.emptyBody} />;
  }

  async function applyCoupon(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/cart/coupon', { code: coupon });
      setQuote(data.quote);
      if (data.quote?.couponError) setError(data.quote.couponError);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        contactName: form.contactName,
        phone: form.phone,
        couponCode: coupon || undefined,
        paymentMethod: method,
        upiRef: method === 'upi' ? upiRef : undefined,
        shippingAddress: {
          name: form.contactName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
      });
      await fetchServer();
      if (method === 'gateway' && data.cashfree?.paymentSessionId) {
        await startCashfreeCheckout(data.cashfree);
        try {
          await api.post(`/orders/${data.order._id}/cashfree/verify`);
        } catch {
          /* account page will verify on return */
        }
      }
      navigate(`/account?placed=${data.order.orderNumber}${method === 'gateway' ? '&cf=1' : ''}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const q = quote || {};
  const pay = q.payment || { cod: true, upi: true };

  return (
    <div className="shell grid gap-8 py-8 md:grid-cols-2">
      <form onSubmit={submit} className="space-y-3">
        <h1 className="font-serif text-2xl gold-text">{page.title}</h1>
        <p className="text-sm text-lilac">{page.body}</p>
        {[['contactName', 'Full name'], ['phone', 'Phone'], ['line1', 'Address'], ['line2', 'Apartment / landmark'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode'], ['country', 'Country']].map(([k, label]) => (
          <label key={k} className="block text-xs uppercase tracking-widest text-gold">
            {label}
            <input
              required={k !== 'line2'}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              className="mt-1 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
            />
          </label>
        ))}
        {q.pincode && !q.pincode.serviceable && (
          <p className="text-sm text-red-300">We do not deliver to this pincode yet.</p>
        )}
        {q.pincode?.serviceable && q.pincode.source === 'ithink' && (
          <p className="text-xs text-lilac">
            Delivery is available via iThink Logistics
            {q.settings?.estimatedDays ? ` · about ${q.settings.estimatedDays} days after dispatch` : ''}.
            Customized bracelets may need extra preparation time.
          </p>
        )}
        {q.pincode?.serviceable && q.pincode.cod === false && (
          <p className="text-xs text-lilac">Cash on delivery is not available for this pincode. Please pay online.</p>
        )}
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Payment</p>
          <div className="mt-2 space-y-2 text-sm text-lilac">
            {pay.cod && (
              <label className="flex items-center gap-2">
                <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} /> Cash on delivery
              </label>
            )}
            {pay.upi && (
              <label className="flex items-center gap-2">
                <input type="radio" name="pay" checked={method === 'upi'} onChange={() => setMethod('upi')} /> UPI{pay.upiId ? ` · ${pay.upiId}` : ''}
              </label>
            )}
            {pay.gateway && (
              <label className="flex items-center gap-2">
                <input type="radio" name="pay" checked={method === 'gateway'} onChange={() => setMethod('gateway')} /> {pay.gatewayName || 'Cashfree'} (card / UPI / netbanking)
              </label>
            )}
          </div>
          {method === 'upi' && (
            <input className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" placeholder="UPI reference (optional)" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
          )}
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={busy || !method || q.pincode?.serviceable === false}>{busy ? page.submitBusy : page.submitLabel}</Button>
      </form>
      <aside className="h-fit rounded-2xl p-5 gold-border">
        <h2 className="font-serif text-xl">{page.summaryTitle}</h2>
        <ul className="mt-4 space-y-2 text-sm text-lilac">
          {items.map((i) => (
            <li key={i._id} className="flex justify-between gap-3">
              <span>{i.snapshot?.name || i.snapshot?.engravingName || i.snapshot?.intention?.name || 'Custom bracelet'} × {i.quantity}</span>
              <Price value={i.lineTotal} />
            </li>
          ))}
        </ul>
        <form onSubmit={applyCoupon} className="mt-4 flex gap-2">
          <input className="flex-1 rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" placeholder="Coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <Button type="submit" variant="ghost">Apply</Button>
        </form>
        {q.coupon?.code && (
          <button
            type="button"
            className="mt-2 text-[11px] uppercase tracking-widest text-gold"
            onClick={async () => {
              await api.delete('/cart/coupon');
              setCoupon('');
              const qs = new URLSearchParams();
              if (form.pincode) qs.set('pincode', form.pincode);
              const { data } = await api.get(`/checkout/quote?${qs}`);
              setQuote(data.quote);
            }}
          >
            Remove coupon
          </button>
        )}
        <dl className="mt-4 space-y-1 text-sm text-lilac">
          <div className="flex justify-between"><dt>Subtotal</dt><dd><Price value={q.subtotal ?? items.reduce((n, i) => n + i.lineTotal, 0)} /></dd></div>
          {q.discount ? <div className="flex justify-between text-gold"><dt>Discount {q.coupon?.code ? `(${q.coupon.code})` : ''}</dt><dd>-<Price value={q.discount} /></dd></div> : null}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{q.shippingFee === 0 ? 'Free' : <Price value={q.shippingFee || 0} />}</dd></div>
          {q.tax ? <div className="flex justify-between"><dt>GST</dt><dd><Price value={q.tax} /></dd></div> : null}
        </dl>
        <div className="mt-4 flex justify-between border-t border-gold/20 pt-3 font-serif text-xl text-gold">
          <span>Total</span>
          <Price value={q.total ?? items.reduce((n, i) => n + i.lineTotal, 0)} />
        </div>
      </aside>
    </div>
  );
}
