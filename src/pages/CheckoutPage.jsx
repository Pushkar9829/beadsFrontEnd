import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';
import GemVisual from '../components/ui/GemVisual';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import { useSite } from '../store/contentStore';
import { startCashfreeCheckout } from '../lib/cashfree';
import AddressPicker from '../components/checkout/AddressPicker';
import AddressFormModal from '../components/checkout/AddressFormModal';
import CouponPicker from '../components/cart/CouponPicker';
import { detectCurrentAddress } from '../lib/location';
import { itemMeta, itemTitle } from '../lib/cartItems';
import { addressId, addressReady, checkoutFromAddress, defaultAddress, digitsOnly, emptyAddress, normalizePhone, upsertAddress, validateAddress } from '../lib/addresses';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Bag', to: '/cart' },
  { label: 'Checkout' },
];

function emptyDraft(user) {
  const base = checkoutFromAddress(emptyAddress({ phone: user?.phone || '' }), user);
  return {
    label: 'Home',
    ...base,
    phone: digitsOnly(base.phone, 10),
    pincode: digitsOnly(base.pincode, 6),
  };
}

export default function CheckoutPage() {
  const page = useSite().pages.checkout;
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const items = useCartStore((s) => s.items);
  const fetchServer = useCartStore((s) => s.fetchServer);
  const navigate = useNavigate();
  const addresses = user?.addresses || [];
  const preferred = defaultAddress(user);
  const [form, setForm] = useState(() => checkoutFromAddress(preferred, user));
  const [selectedId, setSelectedId] = useState(preferred ? addressId(preferred) : '');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(() => emptyDraft(user));
  const [makeDefault, setMakeDefault] = useState(!addresses.length);
  const [locating, setLocating] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [quote, setQuote] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [method, setMethod] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [needAddress, setNeedAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = addresses.find((row) => addressId(row) === selectedId) || null;
  const amount = items.reduce((n, i) => n + i.lineTotal, 0);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    const list = user.addresses || [];
    if (!list.length) {
      setSelectedId('');
      setForm(checkoutFromAddress(null, user));
      return;
    }
    if (list.some((row) => addressId(row) === selectedIdRef.current)) return;
    const next = defaultAddress(user);
    if (!next) return;
    setSelectedId(addressId(next));
    setForm(checkoutFromAddress(next, user));
  }, [user]);

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
  }, [items.length, form.pincode, amount]);

  if (!items.length) {
    return <EmptyState title={page.emptyTitle} body={page.emptyBody} />;
  }

  function applySaved(row, contactName = user?.name) {
    setSelectedId(addressId(row));
    setForm(checkoutFromAddress(row, { ...user, name: contactName || user?.name }));
    setModalOpen(false);
    setCurrentLocation(null);
    setAddressError('');
    setFieldErrors({});
    setError('');
    setNeedAddress(false);
  }

  function openNewAddress() {
    setDraft(emptyDraft(user));
    setMakeDefault(!addresses.length);
    setCurrentLocation(null);
    setAddressError('');
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeNewAddress() {
    setModalOpen(false);
    setCurrentLocation(null);
    setAddressError('');
    setFieldErrors({});
  }

  async function useCurrentLocation() {
    setLocating(true);
    setAddressError('');
    try {
      const found = await detectCurrentAddress();
      setCurrentLocation(found);
      setDraft((current) => ({
        ...current,
        ...checkoutFromAddress({ ...emptyAddress(), ...found, phone: current.phone || user?.phone }, user),
        label: current.label || found.label || 'Home',
        contactName: current.contactName || user?.name || '',
        phone: digitsOnly(current.phone || user?.phone || found.phone || '', 10),
        pincode: digitsOnly(found.pincode || current.pincode, 6),
      }));
      if (found.needsPincode) {
        setAddressError('Location found. Add your 6-digit pincode to continue.');
        setFieldErrors((current) => ({ ...current, pincode: 'Enter a 6-digit pincode.' }));
      }
    } catch (err) {
      setAddressError(err.message || 'Could not read your location.');
    } finally {
      setLocating(false);
    }
  }

  function changeDraft(key, value) {
    const nextValue = key === 'phone' || key === 'pincode'
      ? digitsOnly(value, key === 'phone' ? 10 : 6)
      : value;
    setDraft((current) => ({ ...current, [key]: nextValue }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function saveNewAddress() {
    const nextDraft = {
      label: (draft.label || 'Home').trim() || 'Home',
      contactName: draft.contactName,
      line1: draft.line1,
      line2: draft.line2,
      city: draft.city,
      state: draft.state,
      pincode: digitsOnly(draft.pincode, 6),
      country: draft.country || 'India',
      phone: normalizePhone(draft.phone),
      isDefault: makeDefault || !addresses.length,
      source: currentLocation ? 'gps' : 'manual',
      lat: currentLocation?.lat,
      lng: currentLocation?.lng,
      display: currentLocation?.display || '',
    };
    const errors = validateAddress(nextDraft, { requireName: true });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setAddressError('Fix the marked fields to save this address.');
      return;
    }
    setSavingAddress(true);
    setAddressError('');
    setFieldErrors({});
    try {
      const saved = await updateProfile({
        phone: user.phone || nextDraft.phone,
        addresses: upsertAddress(addresses, nextDraft),
      });
      const prev = new Set(addresses.map(addressId));
      const created = (saved.addresses || []).find((row) => !prev.has(addressId(row)))
        || defaultAddress(saved);
      if (created) applySaved(created, nextDraft.contactName);
    } catch (err) {
      setAddressError(err.message || 'Could not save address.');
    } finally {
      setSavingAddress(false);
    }
  }

  async function applyCoupon() {
    setError('');
    setCouponMsg('');
    try {
      const { data } = await api.post('/cart/coupon', { code: coupon });
      setQuote(data.quote);
      if (data.quote?.coupon?.code) setCoupon(data.quote.coupon.code);
      setCouponMsg(data.quote?.coupon ? 'Applied.' : data.quote?.couponError || '');
      if (data.quote?.couponError) setError(data.quote.couponError);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshQuote() {
    const qs = new URLSearchParams();
    if (form.pincode) qs.set('pincode', form.pincode);
    const { data } = await api.get(`/checkout/quote?${qs}`);
    setQuote(data.quote);
    if (data.quote?.coupon?.code) setCoupon(data.quote.coupon.code);
    else setCoupon('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!selected || !addressReady(form)) {
      setNeedAddress(true);
      setError('Add a delivery address to continue.');
      openNewAddress();
      return;
    }
    if (!method) {
      setError('Choose a payment method.');
      return;
    }
    if (quote?.pincode?.serviceable === false) {
      setError('We do not deliver to this pincode yet.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        contactName: form.contactName,
        phone: normalizePhone(form.phone),
        couponCode: coupon || undefined,
        paymentMethod: method,
        upiRef: method === 'upi' ? upiRef : undefined,
        shippingAddress: {
          name: form.contactName,
          phone: normalizePhone(form.phone),
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          pincode: digitsOnly(form.pincode, 6),
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
  const eta = q.settings?.estimatedDays ? `About ${q.settings.estimatedDays} days` : 'Standard';
  const canContinue = Boolean(selected && addressReady(form));

  return (
    <div className="cart-page checkout-page relative is-filled">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell cart-shell">
        <Breadcrumbs items={CRUMBS} />
        <div className="cart-head">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{page.title}</p>
          <h1 className="mt-2 font-serif text-2xl gold-text sm:text-3xl">{page.title}</h1>
          {page.body ? <p className="mt-2 max-w-xl text-sm text-lilac">{page.body}</p> : null}
        </div>

        <div className="bag-stage">
          <section>
            <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_4rem_5.5rem_6.5rem] gap-3 text-[10px] uppercase tracking-widest text-gold lg:grid">
              <span>Product</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Total</span>
              <span className="text-right">Delivery</span>
            </div>
            <InViewGroup className="bag-list">
              {items.map((item, i) => {
                const snap = item.snapshot || {};
                const title = itemTitle(item);
                const meta = itemMeta(item);
                const href = item.kind === 'product' && snap.slug ? `/p/${snap.slug}` : null;
                const kindLabel = item.kind === 'custom_bracelet' ? 'Studio' : snap.family || 'House';
                const media = (
                  <GemVisual
                    color={snap.colorHex || snap.beads?.[0]?.colorHex}
                    image={snap.image}
                    className="h-full w-full"
                    name={title}
                  />
                );
                return (
                  <article key={item._id} className="bag-item bag-card" style={{ '--i': i }}>
                    <div className="bag-card-media">
                      {href ? <Link to={href} className="block h-full w-full">{media}</Link> : media}
                    </div>
                    <div className="bag-card-body">
                      <p className="bag-card-kind">{kindLabel}</p>
                      {href ? <Link to={href}><h2 className="bag-card-title">{title}</h2></Link> : <h2 className="bag-card-title">{title}</h2>}
                      {meta && <p className="bag-card-meta">{meta}</p>}
                      <div className="bag-card-foot">
                        <p className="text-xs text-lilac">Qty {item.quantity}</p>
                        <div className="bag-card-price-row">
                          <Price value={item.lineTotal} className="text-gold" />
                          <span className="text-[11px] uppercase tracking-widest text-lilac">{eta}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </InViewGroup>
          </section>

          <form onSubmit={submit} className="bag-summary space-y-5">
            <AddressPicker
              addresses={addresses}
              selectedId={selectedId}
              selected={selected}
              phone={form.phone}
              onSelect={applySaved}
              onAddNew={openNewAddress}
              missing={needAddress && !canContinue}
            />

            <div className="relative space-y-5">
              {!canContinue && (
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                  onClick={() => {
                    setNeedAddress(true);
                    setError('Add a delivery address to continue.');
                    openNewAddress();
                  }}
                  aria-label="Add a delivery address to continue"
                />
              )}
              <div className={!canContinue ? 'pointer-events-none select-none opacity-40' : ''}>
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

                <div className="border-t border-gold/20 pt-4">
                  <p className="mb-2 text-xs uppercase tracking-widest text-gold">Apply coupon</p>
                  <div className="mb-3 flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-gold/30 bg-ink px-3 py-2 text-sm text-ivory"
                      placeholder="Enter coupon code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button type="button" variant="ghost" onClick={applyCoupon}>Apply</Button>
                  </div>
                  <CouponPicker
                    signedIn
                    fromPath="/checkout"
                    appliedCode={q.coupon?.code || coupon}
                    refreshKey={`${items.length}-${amount}-${form.pincode}`}
                    onQuote={(next, message) => {
                      if (next) {
                        setQuote(next);
                        if (next.coupon?.code) setCoupon(next.coupon.code);
                      }
                      if (message) setCouponMsg(message);
                    }}
                  />
                  {q.coupon?.code && (
                    <button
                      type="button"
                      className="text-[11px] uppercase tracking-widest text-gold"
                      onClick={async () => {
                        await api.delete('/cart/coupon');
                        setCouponMsg('');
                        await refreshQuote();
                      }}
                    >
                      Remove {q.coupon.code}
                    </button>
                  )}
                  {couponMsg && <p className="mt-2 text-xs text-lilac">{couponMsg}</p>}
                </div>

                <div className="border-t border-gold/20 pt-4">
                  <p className="text-xs uppercase tracking-widest text-gold">{page.summaryTitle || 'Bill summary'}</p>
                  <dl className="bag-summary-rows">
                    <div>
                      <dt>Item total</dt>
                      <dd><Price value={q.subtotal ?? amount} /></dd>
                    </div>
                    <div>
                      <dt>{q.coupon?.code ? `Coupon (${q.coupon.code})` : q.offer?.discount ? `Offer (${q.offer.name})` : 'Coupon'}</dt>
                      <dd>{q.discount ? <>-<Price value={q.discount} /></> : '—'}</dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>{q.shippingFee === 0 ? (q.offer?.freeShipping ? `Free${q.offer.shippingName ? ` · ${q.offer.shippingName}` : ''}` : 'Free') : <Price value={q.shippingFee || 0} />}</dd>
                    </div>
                    {q.tax ? (
                      <div>
                        <dt>GST</dt>
                        <dd><Price value={q.tax} /></dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Total</dt>
                      <dd className="bag-summary-total"><Price value={q.total ?? amount} /></dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t border-gold/20 pt-4">
                  <p className="text-xs uppercase tracking-widest text-gold">Choose payment</p>
                  <div className="mt-2 space-y-2 text-sm text-lilac">
                    {pay.cod && (
                      <label className="flex items-center justify-between gap-2 rounded-xl border border-gold/20 px-3 py-2.5">
                        <span>Cash on delivery</span>
                        <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                      </label>
                    )}
                    {pay.gateway && (
                      <label className="flex items-center justify-between gap-2 rounded-xl border border-gold/20 px-3 py-2.5">
                        <span>Online payment{pay.gatewayName ? ` · ${pay.gatewayName}` : ''}</span>
                        <input type="radio" name="pay" checked={method === 'gateway'} onChange={() => setMethod('gateway')} />
                      </label>
                    )}
                    {pay.upi && (
                      <label className="flex items-center justify-between gap-2 rounded-xl border border-gold/20 px-3 py-2.5">
                        <span>UPI{pay.upiId ? ` · ${pay.upiId}` : ''}</span>
                        <input type="radio" name="pay" checked={method === 'upi'} onChange={() => setMethod('upi')} />
                      </label>
                    )}
                  </div>
                  {method === 'upi' && (
                    <input
                      className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
                      placeholder="UPI reference (optional)"
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || (canContinue && (!method || q.pincode?.serviceable === false))}>
              {canContinue ? (busy ? page.submitBusy : page.submitLabel) : 'Add address to continue'}
            </Button>
            <div className="flex flex-col items-center gap-2 text-center text-[11px] uppercase tracking-widest text-lilac">
              <Link to="/cart" className="text-gold">Back to cart</Link>
              <Link to="/shop">Continue shopping</Link>
              <Link to="/wishlist">View wishlist</Link>
            </div>
          </form>
        </div>
      </div>
      {modalOpen && (
        <AddressFormModal
          draft={draft}
          onChange={changeDraft}
          onClose={closeNewAddress}
          onSave={saveNewAddress}
          onUseLocation={useCurrentLocation}
          locating={locating}
          currentAddress={currentLocation}
          makeDefault={makeDefault}
          onMakeDefault={setMakeDefault}
          saving={savingAddress}
          error={addressError}
          fieldErrors={fieldErrors}
        />
      )}
    </div>
  );
}
