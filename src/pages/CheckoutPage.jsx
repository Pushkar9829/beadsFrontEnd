import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import { startCashfreeCheckout } from '../lib/cashfree';
import { formatInr } from '../lib/format';
import { itemTitle } from '../lib/cartItems';
import GemVisual from '../components/ui/GemVisual';
import AddressPicker from '../components/checkout/AddressPicker';
import AddressFormModal from '../components/checkout/AddressFormModal';
import CouponPicker from '../components/cart/CouponPicker';
import { showToast } from '../components/layout/QuickToast';
import { detectCurrentAddress } from '../lib/location';
import emblem from '../assets/brand/emblem.png';
import { addressId, addressReady, checkoutFromAddress, defaultAddress, digitsOnly, emptyAddress, normalizePhone, upsertAddress, validateAddress } from '../lib/addresses';

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

  // Source: CheckoutPage.jsx lines 124-146 (empty bag card in the left column).
  if (!items.length) {
    return (
      <div className="co-page">
        <div className="container-custom co-wrap">
          <div className="co-grid">
            <div className="co-left">
              <div className="co-empty">
                <img src={emblem} alt="Kuberstones" className="co-empty-logo" />
                <h3 className="co-empty-t">{page.emptyTitle || 'Your Bag is Empty'}</h3>
                <p className="co-empty-p">{page.emptyBody || 'Choose your sacred intention and return to checkout.'}</p>
                <Link to="/shop" className="btn-gold co-empty-btn">
                  Explore Catalogue
                </Link>
              </div>
            </div>
          </div>
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
      showToast('✨ Delivery address updated!', 'gold');
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
      setCouponMsg(data.quote?.coupon ? '' : data.quote?.couponError || '');
      if (data.quote?.coupon?.code) showToast(`✨ Coupon ${data.quote.coupon.code} applied!`, 'gold');
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
      showToast(`Order #${data.order.orderNumber} consecrated & placed!`, 'gold');
      navigate(`/account?placed=${data.order.orderNumber}${method === 'gateway' ? '&cf=1' : ''}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const q = quote || {};
  const pay = q.payment || { cod: true, upi: true };
  const eta = `About ${q.settings?.estimatedDays || 5} days`;
  const canContinue = Boolean(selected && addressReady(form));
  const threshold = q.settings?.freeThreshold;
  const offerOff = !q.coupon?.code && q.offer?.discount ? q.discount : 0;
  const couponOff = q.coupon?.code ? q.discount : 0;
  const deliveryLabel = q.shippingFee
    ? null
    : ['Free', q.offer?.freeShipping && q.offer.shippingName ? q.offer.shippingName : threshold ? `Free shipping over ${formatInr(threshold)}` : '']
        .filter(Boolean)
        .join(' · ');

  async function removeAppliedCoupon() {
    await api.delete('/cart/coupon');
    setCouponMsg('');
    await refreshQuote();
    showToast('Coupon removed', 'muted');
  }

  // Source: beeds_ecommerce/src/pages/CheckoutPage.jsx (items left, side panel right). Styles: styles/atelier/commerce.css "Checkout".
  return (
    <div className="co-page">
      <div className="container-custom co-wrap">
        <div className="co-grid">
          {/* LEFT COLUMN: items list (source lines 122-239) */}
          <div className="co-left">
            <div className="co-items">
              {items.map((item) => {
                const snap = item.snapshot || {};
                const title = itemTitle(item);
                const href = item.kind === 'product' && snap.slug ? `/p/${snap.slug}` : null;
                return (
                  <div key={item._id} className="co-item">
                    <div className="co-thumb">
                      <GemVisual color={snap.colorHex || snap.beads?.[0]?.colorHex} image={snap.image} className="co-thumb-img" name={title} />
                    </div>
                    <div className="co-item-body">
                      <span className="co-label is-item">{item.kind === 'custom_bracelet' ? 'Studio' : snap.family || 'Crystals'}</span>
                      <h4 className="co-item-name">{href ? <Link to={href}>{title}</Link> : title}</h4>
                      <div className="co-item-row">
                        <span className="co-qty">Qty {item.quantity}</span>
                        <div className="co-item-price">
                          <span className="co-price">{formatInr(item.lineTotal)}</span>
                          <span className="co-eta">{eta}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: side panel (source lines 241-656) */}
          <form onSubmit={submit} className="co-panel">
            {/* BLOCK 1: DELIVERY TO */}
            <AddressPicker
              addresses={addresses}
              selectedId={selectedId}
              selected={selected}
              phone={form.phone}
              onSelect={applySaved}
              onAddNew={openNewAddress}
              missing={needAddress && !canContinue}
            />

            <div className={`co-gate${canContinue ? '' : ' is-locked'}`}>
              {!canContinue && (
                <button
                  type="button"
                  className="co-gate-hit"
                  onClick={() => {
                    setNeedAddress(true);
                    setError('Add a delivery address to continue.');
                    openNewAddress();
                  }}
                  aria-label="Add a delivery address to continue"
                />
              )}
              <div className="co-gate-c">
                {q.pincode && !q.pincode.serviceable && <p className="co-bad">We do not deliver to this pincode yet.</p>}
                {q.pincode?.serviceable && q.pincode.source === 'ithink' && (
                  <p className="co-note">
                    Delivery is available via iThink Logistics
                    {q.settings?.estimatedDays ? ` · about ${q.settings.estimatedDays} days after dispatch` : ''}.
                    Customized bracelets may need extra preparation time.
                  </p>
                )}
                {q.pincode?.serviceable && q.pincode.cod === false && (
                  <p className="co-note">Cash on delivery is not available for this pincode. Please pay online.</p>
                )}

                {/* BLOCK 2: APPLY COUPON */}
                <div className="co-block">
                  <span className="co-label">Apply coupon</span>
                  {!q.coupon?.code ? (
                    <div className="co-coupon">
                      <input
                        className="co-coupon-input"
                        placeholder="Enter coupon code"
                        aria-label="Coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                      />
                      <button type="button" className="co-coupon-btn" onClick={applyCoupon}>
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="co-applied">
                      <div className="co-applied-l">
                        <Check size={14} color="#34D399" />
                        <div>
                          <span className="co-applied-code">{q.coupon.code}</span>
                          <span className="co-applied-label">· -{formatInr(q.discount)}</span>
                        </div>
                      </div>
                      <button type="button" className="co-applied-x" title="Remove coupon" aria-label="Remove coupon" onClick={removeAppliedCoupon}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <CouponPicker
                    signedIn
                    fromPath="/checkout"
                    appliedCode={q.coupon?.code || coupon}
                    refreshKey={`${items.length}-${amount}-${form.pincode}`}
                    onRemove={removeAppliedCoupon}
                    onQuote={(next, message) => {
                      if (next) {
                        setQuote(next);
                        if (next.coupon?.code) setCoupon(next.coupon.code);
                      }
                      if (message) setCouponMsg(message);
                    }}
                  />
                  {couponMsg && <p className="co-note">{couponMsg}</p>}
                </div>

                {/* BLOCK 3: SUMMARY */}
                <div className="co-block">
                  <span className="co-label is-sum">Summary</span>
                  <div className="co-rows">
                    <div className="co-row">
                      <span>Item total</span>
                      <span className="is-v">{formatInr(q.subtotal ?? amount)}</span>
                    </div>
                    {offerOff > 0 && (
                      <div className="co-row is-offer">
                        <span>Offer ({q.offer.name})</span>
                        <span className="is-v">-{formatInr(offerOff)}</span>
                      </div>
                    )}
                    {couponOff > 0 && (
                      <div className="co-row is-coupon">
                        <span>Coupon ({q.coupon.code})</span>
                        <span>-{formatInr(couponOff)}</span>
                      </div>
                    )}
                    <div className="co-row">
                      <span>Delivery</span>
                      {deliveryLabel ? <span className="is-ship">{deliveryLabel}</span> : <span className="is-v">{formatInr(q.shippingFee)}</span>}
                    </div>
                    <div className="co-row">
                      <span>GST</span>
                      <span className="is-v">{formatInr(q.tax || 0)}</span>
                    </div>
                  </div>
                  <div className="co-total">
                    <span className="co-total-k">Total</span>
                    <span className="co-total-v">{formatInr(q.total ?? amount)}</span>
                  </div>
                </div>

                {/* BLOCK 4: CHOOSE PAYMENT */}
                <div className="co-block">
                  <span className="co-label is-pay">Choose payment</span>
                  {pay.cod && (
                    <label className={`co-pay${method === 'cod' ? ' is-on' : ''}`}>
                      <input type="radio" name="pay" className="co-sr" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                      Cash on delivery
                    </label>
                  )}
                  {pay.gateway && (
                    <label className={`co-pay${method === 'gateway' ? ' is-on' : ''}`}>
                      <input type="radio" name="pay" className="co-sr" checked={method === 'gateway'} onChange={() => setMethod('gateway')} />
                      Online payment{pay.gatewayName ? ` · ${pay.gatewayName}` : ''}
                    </label>
                  )}
                  {pay.upi && (
                    <label className={`co-pay${method === 'upi' ? ' is-on' : ''}`}>
                      <input type="radio" name="pay" className="co-sr" checked={method === 'upi'} onChange={() => setMethod('upi')} />
                      UPI{pay.upiId ? ` · ${pay.upiId}` : ''}
                    </label>
                  )}
                  {method === 'upi' && (
                    <input className="co-input" placeholder="UPI reference (optional)" aria-label="UPI reference" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
                  )}
                </div>
              </div>
            </div>

            {error && <p className="co-bad">{error}</p>}
            <button type="submit" className="co-place" disabled={busy || (canContinue && (!method || q.pincode?.serviceable === false))}>
              {canContinue ? (busy ? page.submitBusy || 'Placing…' : page.submitLabel || 'Place order') : 'Add address to continue'}
            </button>

            {/* Links footer (source lines 602-653) */}
            <div className="co-links">
              <div className="co-links-row">
                <Link to="/cart" className="co-link">Back to bag</Link>
                <Link to="/" className="co-link">Continue shopping</Link>
              </div>
              <div className="co-links-row2">
                <Link to="/wishlist" className="co-link">Wishlist</Link>
              </div>
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
