import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogOut, MapPin, Package, Sparkles, User } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import Spinner from '../components/ui/Spinner';
import GemVisual from '../components/ui/GemVisual';
import { fillCopy } from '../lib/homeContent';
import { formatInr } from '../lib/format';
import { itemMeta } from '../lib/cartItems';
import { useSite } from '../store/contentStore';
import { isStaff } from '../lib/staff';
import { startCashfreeCheckout } from '../lib/cashfree';
import { RETURN_REASONS } from '../lib/returnReasons';
import AddressBook from '../components/account/AddressBook';
import { showToast } from '../components/layout/QuickToast';

const STATUS_LABEL = {
  pending_payment: 'Awaiting Payment',
  paid: 'Paid',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};
const TABS = [
  { id: 'orders', label: 'Sacred Orders', key: 'tabOrders', Icon: Package },
  { id: 'profile', label: 'Personal Dossier', key: 'tabProfile', Icon: User },
];

export default function AccountPage() {
  const page = useSite().pages.account;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const onLogout = useCartStore((s) => s.onLogout);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const placed = params.get('placed');
  const fromCashfree = params.get('cf') === '1';
  const [returnFor, setReturnFor] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnCode, setReturnCode] = useState('wrong_product');
  const [returnType, setReturnType] = useState('return');
  const [returnNote, setReturnNote] = useState({ id: '', text: '' });
  const [trackNote, setTrackNote] = useState({ id: '', text: '' });
  const wishCount = useWishlistStore((s) => s.items.length);
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' && window.location.hash === '#addresses' ? 'profile' : 'orders'));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get('/orders/mine')
      .then(async ({ data }) => {
        const list = data.orders || [];
        setOrders(list);
        if (fromCashfree && placed) {
          const match = list.find((o) => o.orderNumber === placed && o.payment?.method === 'gateway' && o.payment?.status !== 'paid');
          if (match) {
            try {
              const { data: verified } = await api.post(`/orders/${match._id}/cashfree/verify`);
              setOrders((prev) => prev.map((o) => (o._id === match._id ? verified.order : o)));
            } catch {
              /* keep pending */
            }
          }
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, fromCashfree, placed]);

  useEffect(() => {
    if (!user || window.location.hash !== '#addresses') return;
    document.getElementById('addresses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [user]);

  // Source: beeds_ecommerce/src/pages/AuthPage.jsx account view (lines 150-684): breadcrumbs, member banner with
  // stats, tabs, order cards, dossier. Styles: styles/atelier/commerce.css "Account".
  return (
    <div className="acct-page">
      <div className="container-custom">
        <nav className="acct-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="is-on">{page.crumbLabel || 'Sanctuary Account'}</span>
        </nav>

        <div className="acct-hero">
          <div className="acct-hero-row">
            <div className="acct-id">
              <div className="acct-avatar">
                <div>{(user.name || 'K').charAt(0).toUpperCase()}</div>
              </div>
              <div>
                <div className="acct-chip-row">
                  <span className="acct-chip">
                    <Sparkles size={11} /> {page.memberLabel || 'Member'}
                  </span>
                  {user.createdAt && <span className="acct-since">· Member since {new Date(user.createdAt).getFullYear()}</span>}
                </div>
                <h1 className="acct-name">
                  {page.greeting || 'Namaste,'} {user.name}
                </h1>
                <p className="acct-contact">
                  {user.email} {user.phone && `· ${user.phone}`}
                </p>
              </div>
            </div>
            <div className="acct-actions">
              {isStaff(user) && (
                <Link to="/admin" className="btn-outline acct-btn-o">
                  Admin
                </Link>
              )}
              <Link to={page.designTo || '/customize'} className="btn-gold acct-btn">
                <Sparkles size={14} /> {page.designAction || 'Design In Atelier'}
              </Link>
              <button
                type="button"
                className="btn-outline acct-btn-o"
                onClick={async () => {
                  await logout();
                  onLogout();
                  showToast('You have safely exited the Sanctuary', 'muted');
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          <div className="acct-stats">
            <div>
              <span className="acct-stat-k">{page.statOrders || 'Orders'}</span>
              <div className="acct-stat-v">{loading ? '—' : orders.length}</div>
            </div>
            <div>
              <span className="acct-stat-k">{page.statWishlist || 'Sacred Wishlist'}</span>
              <div className="acct-stat-v is-gold">{wishCount} saved</div>
            </div>
            <div>
              <span className="acct-stat-k">{page.statAddresses || 'Saved Addresses'}</span>
              <div className="acct-stat-v is-s">
                <MapPin size={15} /> {(user.addresses || []).length}
              </div>
            </div>
          </div>
        </div>

        <div className="acct-tabs" role="tablist">
          {TABS.map(({ id, label, key, Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={`acct-tab${tab === id ? ' is-on' : ''}`} onClick={() => setTab(id)}>
              <Icon size={15} />
              {page[key] || label}
            </button>
          ))}
        </div>

        {placed && (
          <div className="acct-placed">
            <span className="acct-placed-k">{page.placedKicker || 'Order placed'}</span>
            <p className="acct-muted">{fillCopy(page.placedBody, { number: placed })}</p>
          </div>
        )}

        {tab === 'profile' && (
          <div className="acct-profile">
            <div className="acct-panel">
              <h3 className="acct-panel-t">Sanctuary Member Dossier</h3>
              <div className="acct-dossier">
                <div>
                  <label className="acct-label" htmlFor="acct-name">Full Name</label>
                  <input id="acct-name" type="text" className="acct-input" value={user.name || ''} readOnly />
                </div>
                <div>
                  <label className="acct-label" htmlFor="acct-email">Email</label>
                  <input id="acct-email" type="text" className="acct-input" value={user.email || ''} readOnly />
                </div>
              </div>
            </div>
            <AddressBook />
          </div>
        )}

        {tab === 'orders' &&
          (loading ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <div className="acct-panel acct-empty">
              <h3 className="acct-panel-t">{page.empty?.title || 'No orders yet.'}</h3>
              {page.empty?.copy && <p className="acct-muted">{page.empty.copy}</p>}
              {page.empty?.primaryCta?.to && (
                <Link to={page.empty.primaryCta.to} className="btn-gold acct-btn">
                  {String(page.empty.primaryCta.label || 'Shop all').replace(/\s*→\s*$/, '')}
                </Link>
              )}
            </div>
          ) : (
            <div className="acct-orders">
              {orders.map((o) => {
                const tone = o.status === 'delivered' ? 'is-ok' : ['cancelled', 'returned'].includes(o.status) ? 'is-off' : '';
                const extras = [
                  o.payment?.method === 'gateway' ? `Cashfree · ${o.payment?.status || 'pending'}` : '',
                  o.couponCode ? `Coupon ${o.couponCode}` : '',
                  o.offerName ? `Offer ${o.offerName}` : '',
                  o.discount ? `Discount ${formatInr(o.discount)}` : '',
                  o.shippingFee != null ? `Ship ${formatInr(o.shippingFee)}` : '',
                  o.tax ? `GST ${formatInr(o.tax)}` : '',
                ].filter(Boolean);
                return (
                  <article key={o._id} className="acct-order">
                    <div className="acct-order-head">
                      <div className="acct-order-id">
                        <span className="acct-order-n">{o.orderNumber}</span>
                        <span className="acct-order-date">Placed on {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className={`acct-order-status ${tone}`}>
                        <span className="acct-dot" />
                        <span>{STATUS_LABEL[o.status] || String(o.status || '').replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="acct-order-items">
                      {(o.items || []).map((item, idx) => {
                        const snap = item.snapshot || {};
                        const name = snap.name || snap.engravingName || snap.intention?.name || 'Item';
                        const spec = [
                          item.kind === 'custom_bracelet' ? itemMeta(item) : '',
                          `Qty ${item.quantity || 1}`,
                        ].filter(Boolean).join(' · ');
                        return (
                          <div key={item._id || idx} className="acct-order-item">
                            <GemVisual color={snap.colorHex || snap.beads?.[0]?.colorHex} image={snap.image} className="acct-order-img" name={name} />
                            <div className="acct-order-info">
                              <h4 className="acct-order-name">{name}</h4>
                              <p className="acct-order-spec">{spec}</p>
                            </div>
                            <div>
                              <span className="acct-order-price">{formatInr(item.lineTotal ?? (item.unitPrice || 0) * (item.quantity || 1))}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="acct-order-foot">
                      <div>
                        <span className="acct-muted-i">Total: </span>
                        <strong className="acct-order-total">{formatInr(o.total)}</strong>
                        {extras.length > 0 && <span className="acct-muted-i acct-gap">· {extras.join(' · ')}</span>}
                        {o.shipment?.waybill && (
                          <span className="acct-muted-i acct-gap">
                            · Tracking: {o.shipment.carrier ? `${o.shipment.carrier.toUpperCase()}-` : ''}
                            {o.shipment.waybill}
                            {o.shipment.lastStatus ? ` · ${o.shipment.lastStatus}` : ''}
                          </span>
                        )}
                        {o.shipment?.returnWaybill && <span className="acct-muted-i acct-gap">· Return pickup {o.shipment.returnWaybill}</span>}
                      </div>

                      <div className="acct-order-acts">
                        {o.shipment?.trackingUrl && (
                          <a href={o.shipment.trackingUrl} className="acct-order-btn" target="_blank" rel="noreferrer">
                            Track Parcel
                          </a>
                        )}
                        {o.shipment?.returnTrackingUrl && (
                          <a href={o.shipment.returnTrackingUrl} className="acct-order-btn" target="_blank" rel="noreferrer">
                            Track return
                          </a>
                        )}
                        {o.shipment?.waybill && (
                          <button
                            type="button"
                            className="acct-order-btn"
                            onClick={async () => {
                              try {
                                const { data } = await api.post(`/orders/${o._id}/track`);
                                setOrders((prev) => prev.map((row) => (row._id === o._id ? data.order : row)));
                                setTrackNote({ id: o._id, text: data.tracking?.forward?.currentStatus || 'Tracking updated.' });
                              } catch (err) {
                                setTrackNote({ id: o._id, text: err.message || 'Could not track.' });
                              }
                            }}
                          >
                            Refresh tracking
                          </button>
                        )}
                        {o.payment?.method === 'gateway' && o.payment?.status !== 'paid' && o.payment?.status !== 'refunded' && (
                          <button
                            type="button"
                            className="acct-order-btn"
                            onClick={async () => {
                              try {
                                const { data } = await api.post(`/orders/${o._id}/cashfree/retry`);
                                if (data.paid) {
                                  setOrders((prev) => prev.map((row) => (row._id === o._id ? data.order : row)));
                                  return;
                                }
                                await startCashfreeCheckout(data.cashfree);
                                const verified = await api.post(`/orders/${o._id}/cashfree/verify`);
                                setOrders((prev) => prev.map((row) => (row._id === o._id ? verified.data.order : row)));
                              } catch (err) {
                                setReturnNote({ id: o._id, text: err.message || 'Could not resume Cashfree.' });
                              }
                            }}
                          >
                            Pay with Cashfree
                          </button>
                        )}
                        {['shipped', 'delivered'].includes(o.status) && returnFor !== o._id && (
                          <button
                            type="button"
                            className="acct-order-btn"
                            onClick={() => {
                              setReturnFor(o._id);
                              setReturnNote({ id: '', text: '' });
                            }}
                          >
                            Request return or exchange
                          </button>
                        )}
                      </div>
                    </div>
                    {trackNote.id === o._id && trackNote.text && <p className="acct-muted">{trackNote.text}</p>}

                    {['shipped', 'delivered'].includes(o.status) && returnFor === o._id && (
                      <form
                        className="acct-return"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setReturnNote({ id: '', text: '' });
                          try {
                            await api.post(`/orders/${o._id}/return`, {
                              type: returnType,
                              reasonCode: returnCode,
                              reason: returnReason || undefined,
                            });
                            setReturnNote({ id: o._id, text: `${returnType === 'exchange' ? 'Exchange' : 'Return'} requested. We will review it shortly.` });
                            setReturnFor(null);
                            setReturnReason('');
                          } catch (err) {
                            setReturnNote({ id: o._id, text: err.message || 'Could not request return.' });
                          }
                        }}
                      >
                        <div className="acct-return-types">
                          <label className={`acct-choice${returnType === 'return' ? ' is-on' : ''}`}>
                            <input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} />
                            Return / refund
                          </label>
                          <label className={`acct-choice${returnType === 'exchange' ? ' is-on' : ''}`}>
                            <input type="radio" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} />
                            Exchange
                          </label>
                        </div>
                        <select className="acct-input" aria-label="Reason" value={returnCode} onChange={(e) => setReturnCode(e.target.value)}>
                          {RETURN_REASONS.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <textarea className="acct-input" placeholder="Add order details or photos note (optional)" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                        <p className="acct-hint">
                          Personalized or customized pieces are not eligible for change of mind once preparation has started. Natural variation is not a defect.
                        </p>
                        <div className="acct-form-acts">
                          <button type="submit" className="btn-gold acct-btn">Submit return</button>
                          <button type="button" className="btn-outline acct-btn-o" onClick={() => setReturnFor(null)}>Cancel</button>
                        </div>
                      </form>
                    )}
                    {returnNote.id === o._id && returnNote.text && <p className="acct-muted">{returnNote.text}</p>}
                  </article>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
}
