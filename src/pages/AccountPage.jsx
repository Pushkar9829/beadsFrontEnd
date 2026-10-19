import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogOut, MapPin, Package, Sparkles, User } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import Spinner from '../components/ui/Spinner';
import { CmsEmpty, PageIntro } from '../components/home/nocturne/Listing';
import { fillCopy } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { isStaff } from '../lib/staff';
import { startCashfreeCheckout } from '../lib/cashfree';
import { RETURN_REASONS } from '../lib/returnReasons';
import AddressBook from '../components/account/AddressBook';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Account' },
];
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

  return (
    <div className={`nx nx-page at-commerce${user ? ' acct-page' : ''}`}>
      {!user ? (
        <PageIntro crumbs={CRUMBS} eyebrow={page.eyebrow} title={page.title} body={page.guestBody} />
      ) : (
        // Source: AuthPage.jsx account view — breadcrumbs, member banner with stats, tabs.
        <div className="container-custom acct-top">
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
        </div>
      )}
      <div className="nx-w nx-body">
        {placed && (
          <div className="nx-sum mb-12">
            <p className="nx-k">{page.placedKicker}</p>
            <p className="nx-note mt-2">{fillCopy(page.placedBody, { number: placed })}</p>
          </div>
        )}

        {user && tab === 'profile' && <AddressBook />}

        {(!user || tab === 'orders') && (
        <section className="nx-acct-sec">
          {!user && (
            <div className="nx-acct-head">
              <div>
                <p className="nx-eb">{page.ordersEyebrow}</p>
                <h2 className="nx-d nx-acct-t">{page.ordersTitle}</h2>
                <p className="nx-note">
                  {loading
                    ? page.ordersLoading
                    : orders.length
                      ? fillCopy(page.ordersFilledBody, { count: orders.length, orders: orders.length === 1 ? 'order' : 'orders' })
                      : page.ordersEmptyBody}
                </p>
              </div>
              {page.ordersAction && (
                <Link to={page.ordersTo || '/customize'} className="nx-lnk">
                  {String(page.ordersAction).replace(/\s*→\s*$/, '')} →
                </Link>
              )}
            </div>
          )}

          {loading ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <CmsEmpty block={page.empty} />
          ) : (
            <div className="nx-orders">
              {orders.map((o) => (
                <article key={o._id} className="nx-order">
                  <div className="nx-order-top">
                    <div>
                      <p className="nx-k">{String(o.status || '').replace('_', ' ')}</p>
                      <h3 className="nx-order-n mt-1">{o.orderNumber}</h3>
                    </div>
                    <span className="nx-order-total">
                      <Price value={o.total} />
                    </span>
                  </div>
                  <p className="nx-note">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                  <ul className="nx-order-items">
                    {(o.items || []).map((item, idx) => (
                      <li key={item._id || idx}>
                        {item.snapshot?.name || item.snapshot?.engravingName || item.snapshot?.intention?.name || 'Item'}
                        {item.snapshot?.mulank ? ` · Mulank ${item.snapshot.mulank}` : ''}
                        {item.snapshot?.zodiac?.sign ? ` · ${item.snapshot.zodiac.sign}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="nx-note">
                    {o.payment?.method === 'gateway' ? `Cashfree · ${o.payment?.status || 'pending'} · ` : ''}
                    {o.couponCode ? `Coupon ${o.couponCode} · ` : ''}
                    {o.offerName ? `Offer ${o.offerName} · ` : ''}
                    {o.discount ? <>Discount <Price value={o.discount} /> · </> : null}
                    {o.shippingFee != null ? <>Ship <Price value={o.shippingFee} /> · </> : null}
                    {o.tax ? <>GST <Price value={o.tax} /></> : null}
                  </p>
                  {(o.shipment?.waybill || o.shipment?.trackingUrl) && (
                    <p className="nx-note">
                      {o.shipment.carrier || 'iThink'} · {o.shipment.waybill}
                      {o.shipment.lastStatus ? ` · ${o.shipment.lastStatus}` : ''}
                      {o.shipment.trackingUrl ? (
                        <> · <a href={o.shipment.trackingUrl} className="nx-lnk" target="_blank" rel="noreferrer">Track</a></>
                      ) : null}
                    </p>
                  )}
                  {o.shipment?.returnWaybill && (
                    <p className="nx-note">
                      Return pickup {o.shipment.returnWaybill}
                      {o.shipment.returnTrackingUrl ? (
                        <> · <a href={o.shipment.returnTrackingUrl} className="nx-lnk" target="_blank" rel="noreferrer">Track return</a></>
                      ) : null}
                    </p>
                  )}

                  <div className="nx-order-acts">
                    {o.shipment?.waybill && (
                      <button
                        type="button"
                        className="nx-mini is-c"
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
                        className="nx-mini is-c"
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
                        className="nx-mini is-c"
                        onClick={() => {
                          setReturnFor(o._id);
                          setReturnNote({ id: '', text: '' });
                        }}
                      >
                        Request return or exchange
                      </button>
                    )}
                  </div>
                  {trackNote.id === o._id && trackNote.text && <p className="nx-msg">{trackNote.text}</p>}

                  {['shipped', 'delivered'].includes(o.status) && returnFor === o._id && (
                    <form
                      className="nx-order-form"
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
                      <div className="nx-inline">
                        <label className="nx-choice flex-1">
                          <span>Return / refund</span>
                          <input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} />
                        </label>
                        <label className="nx-choice flex-1">
                          <span>Exchange</span>
                          <input type="radio" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} />
                        </label>
                      </div>
                      <select className="nx-input" aria-label="Reason" value={returnCode} onChange={(e) => setReturnCode(e.target.value)}>
                        {RETURN_REASONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <textarea className="nx-input" placeholder="Add order details or photos note (optional)" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                      <p className="nx-note">
                        Personalized or customized pieces are not eligible for change of mind once preparation has started. Natural variation is not a defect.
                      </p>
                      <div className="flex gap-2">
                        <Button type="submit" size="s">Submit return</Button>
                        <Button variant="ghost" size="s" onClick={() => setReturnFor(null)}>Cancel</Button>
                      </div>
                    </form>
                  )}
                  {returnNote.id === o._id && returnNote.text && <p className="nx-msg">{returnNote.text}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </div>
  );
}
