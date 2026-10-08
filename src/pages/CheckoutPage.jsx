import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import { useSite } from '../store/contentStore';
import { startCashfreeCheckout } from '../lib/cashfree';
import AddressPicker from '../components/checkout/AddressPicker';
import AddressFormModal from '../components/checkout/AddressFormModal';
import CouponPicker from '../components/cart/CouponPicker';
import { detectCurrentAddress } from '../lib/location';
import BagLine from '../components/cart/BagLine';
import { EmptyBlock, PageIntro } from '../components/home/nocturne/Listing';
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
    return (
      <div className="nx nx-page">
        <PageIntro crumbs={CRUMBS} eyebrow="Secure checkout" title={page.title} />
        <div className="nx-w nx-sec">
          <EmptyBlock
            title={page.emptyTitle}
            body={page.emptyBody}
            actions={
              <>
                <Link to="/shop" className="nx-btn">
                  Shop all
                </Link>
                <Link to="/customize" className="nx-btn nx-btn-o">
                  Customization
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
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
    <div className="nx nx-page">
      <PageIntro crumbs={CRUMBS} eyebrow="Secure checkout" title={page.title} body={page.body} />
      <div className="nx-w nx-body">
        <div className="nx-bag">
          <section aria-label="Your pieces">
            <div className="nx-lines">
              {items.map((item) => (
                <BagLine key={item._id} item={item} aside={<span className="nx-mini">{eta}</span>}>
                  <span className="nx-note">Qty {item.quantity}</span>
                </BagLine>
              ))}
            </div>
          </section>

          <form onSubmit={submit} className="nx-sum">
            <AddressPicker
              addresses={addresses}
              selectedId={selectedId}
              selected={selected}
              phone={form.phone}
              onSelect={applySaved}
              onAddNew={openNewAddress}
              missing={needAddress && !canContinue}
            />

            <div className={`nx-gate${canContinue ? '' : ' is-locked'}`}>
              {!canContinue && (
                <button
                  type="button"
                  className="nx-gate-hit"
                  onClick={() => {
                    setNeedAddress(true);
                    setError('Add a delivery address to continue.');
                    openNewAddress();
                  }}
                  aria-label="Add a delivery address to continue"
                />
              )}
              <div className="nx-gate-c">
                {q.pincode && !q.pincode.serviceable && <p className="nx-bad mt-4">We do not deliver to this pincode yet.</p>}
                {q.pincode?.serviceable && q.pincode.source === 'ithink' && (
                  <p className="nx-note mt-4">
                    Delivery is available via iThink Logistics
                    {q.settings?.estimatedDays ? ` · about ${q.settings.estimatedDays} days after dispatch` : ''}.
                    Customized bracelets may need extra preparation time.
                  </p>
                )}
                {q.pincode?.serviceable && q.pincode.cod === false && (
                  <p className="nx-note mt-4">Cash on delivery is not available for this pincode. Please pay online.</p>
                )}

                <div className="nx-part">
                  <p className="nx-k">Apply coupon</p>
                  <div className="nx-inline">
                    <input className="nx-input" placeholder="Enter coupon code" aria-label="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                    <Button variant="ghost" size="s" onClick={applyCoupon}>Apply</Button>
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
                      className="nx-mini is-c justify-self-start"
                      onClick={async () => {
                        await api.delete('/cart/coupon');
                        setCouponMsg('');
                        await refreshQuote();
                      }}
                    >
                      Remove {q.coupon.code}
                    </button>
                  )}
                  {couponMsg && <p className="nx-msg">{couponMsg}</p>}
                </div>

                <div className="nx-part">
                  <p className="nx-k">{page.summaryTitle || 'Bill summary'}</p>
                  <dl className="nx-rows">
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
                    <div className="is-total">
                      <dt>Total</dt>
                      <dd><Price value={q.total ?? amount} /></dd>
                    </div>
                  </dl>
                </div>

                <div className="nx-part">
                  <p className="nx-k">Choose payment</p>
                  {pay.cod && (
                    <label className="nx-choice">
                      <span>Cash on delivery</span>
                      <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                    </label>
                  )}
                  {pay.gateway && (
                    <label className="nx-choice">
                      <span>Online payment{pay.gatewayName ? ` · ${pay.gatewayName}` : ''}</span>
                      <input type="radio" name="pay" checked={method === 'gateway'} onChange={() => setMethod('gateway')} />
                    </label>
                  )}
                  {pay.upi && (
                    <label className="nx-choice">
                      <span>UPI{pay.upiId ? ` · ${pay.upiId}` : ''}</span>
                      <input type="radio" name="pay" checked={method === 'upi'} onChange={() => setMethod('upi')} />
                    </label>
                  )}
                  {method === 'upi' && (
                    <input className="nx-input" placeholder="UPI reference (optional)" aria-label="UPI reference" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
                  )}
                </div>
              </div>
            </div>

            {error && <p className="nx-bad mt-4">{error}</p>}
            <div className="nx-actions">
              <Button type="submit" className="nx-btn-block" disabled={busy || (canContinue && (!method || q.pincode?.serviceable === false))}>
                {canContinue ? (busy ? page.submitBusy : page.submitLabel) : 'Add address to continue'}
              </Button>
            </div>
            <div className="nx-links">
              <Link to="/cart" className="nx-mini is-c">Back to bag</Link>
              <Link to="/shop" className="nx-mini">Continue shopping</Link>
              <Link to="/wishlist" className="nx-mini">Wishlist</Link>
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
