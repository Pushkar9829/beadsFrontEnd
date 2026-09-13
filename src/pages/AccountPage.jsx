import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Price from '../components/ui/Price';
import Spinner from '../components/ui/Spinner';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
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
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={user ? `${user.name} · ${user.email}` : page.guestBody}
            to={page.to}
            action={page.action}
          />
          <article className="auth-card">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{page.cardKicker}</p>
            <h2 className="mt-2 font-serif text-2xl gold-text">{page.cardTitle}</h2>
            <div className="mt-6 flex flex-col gap-3">
              {isStaff(user) && (
                <Button to="/admin" variant="ghost" className="w-full">Admin</Button>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await logout();
                  onLogout();
                }}
              >
                Sign out
              </Button>
            </div>
          </article>
        </div>

        {placed && (
          <article className="auth-card mt-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{page.placedKicker}</p>
            <p className="mt-2 text-sm leading-relaxed text-lilac">
              {fillCopy(page.placedBody, { number: placed })}
            </p>
          </article>
        )}

        {user && <AddressBook />}

        <div className="mt-12 sm:mt-16">
          <SectionHead
            eyebrow={page.ordersEyebrow}
            title={page.ordersTitle}
            body={
              loading
                ? page.ordersLoading
                : orders.length
                  ? fillCopy(page.ordersFilledBody, {
                      count: orders.length,
                      orders: orders.length === 1 ? 'order' : 'orders',
                    })
                  : page.ordersEmptyBody
            }
            to="/customize"
            action={page.ordersAction}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <CmsFinale block={page.empty} />
        ) : (
          <InViewGroup className="bag-list mt-8 space-y-4 sm:mt-10">
            {orders.map((o, i) => (
              <article key={o._id} className="bag-item bag-card" style={{ '--i': i }}>
                <div className="bag-card-body">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                      {String(o.status || '').replace('_', ' ')}
                    </p>
                    <p className="text-gold">
                      <Price value={o.total} />
                    </p>
                  </div>
                  <h3 className="mt-2 font-serif text-xl leading-snug">{o.orderNumber}</h3>
                  <p className="mt-2 text-sm text-lilac">
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-lilac">
                    {(o.items || []).map((item, idx) => (
                      <li key={item._id || idx}>
                        {item.snapshot?.name || item.snapshot?.engravingName || item.snapshot?.intention?.name || 'Item'}
                        {item.snapshot?.mulank ? ` · Mulank ${item.snapshot.mulank}` : ''}
                        {item.snapshot?.zodiac?.sign ? ` · ${item.snapshot.zodiac.sign}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-lilac">
                    {o.payment?.method === 'gateway' ? `Cashfree · ${o.payment?.status || 'pending'} · ` : ''}
                    {o.couponCode ? `Coupon ${o.couponCode} · ` : ''}
                    {o.discount ? <>Discount <Price value={o.discount} /> · </> : null}
                    {o.shippingFee != null ? <>Ship <Price value={o.shippingFee} /> · </> : null}
                    {o.tax ? <>GST <Price value={o.tax} /></> : null}
                  </p>
                  {(o.shipment?.waybill || o.shipment?.trackingUrl) && (
                    <p className="mt-2 text-xs text-lilac">
                      {o.shipment.carrier || 'iThink'} · {o.shipment.waybill}
                      {o.shipment.lastStatus ? ` · ${o.shipment.lastStatus}` : ''}
                      {o.shipment.trackingUrl ? (
                        <> · <a href={o.shipment.trackingUrl} className="text-gold" target="_blank" rel="noreferrer">Track</a></>
                      ) : null}
                    </p>
                  )}
                  {o.shipment?.returnWaybill && (
                    <p className="mt-1 text-xs text-lilac">
                      Return pickup {o.shipment.returnWaybill}
                      {o.shipment.returnTrackingUrl ? (
                        <> · <a href={o.shipment.returnTrackingUrl} className="text-gold" target="_blank" rel="noreferrer">Track return</a></>
                      ) : null}
                    </p>
                  )}
                  {o.shipment?.waybill && (
                    <button
                      type="button"
                      className="mt-2 text-[11px] uppercase tracking-widest text-gold"
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
                  {trackNote.id === o._id && trackNote.text && <p className="mt-1 text-xs text-gold">{trackNote.text}</p>}
                  {o.payment?.method === 'gateway' && o.payment?.status !== 'paid' && o.payment?.status !== 'refunded' && (
                    <button
                      type="button"
                      className="mt-3 text-[11px] uppercase tracking-widest text-gold"
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
                  {['shipped', 'delivered'].includes(o.status) && (
                    returnFor === o._id ? (
                      <form
                        className="mt-3 space-y-2"
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
                        <div className="flex gap-3 text-xs text-lilac">
                          <label className="flex items-center gap-1">
                            <input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} /> Return / refund
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="radio" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} /> Exchange
                          </label>
                        </div>
                        <select
                          className="w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-sm text-ivory"
                          value={returnCode}
                          onChange={(e) => setReturnCode(e.target.value)}
                        >
                          {RETURN_REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        <textarea
                          className="w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-sm text-ivory"
                          placeholder="Add order details or photos note (optional)"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                        />
                        <p className="text-[11px] leading-relaxed text-lilac">
                          Personalized or customized pieces are not eligible for change of mind once preparation has started. Natural variation is not a defect.
                        </p>
                        <div className="flex gap-2">
                          <Button type="submit">Submit return</Button>
                          <Button type="button" variant="ghost" onClick={() => setReturnFor(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="mt-3 text-[11px] uppercase tracking-widest text-gold"
                        onClick={() => { setReturnFor(o._id); setReturnNote({ id: '', text: '' }); }}
                      >
                        Request return or exchange
                      </button>
                    )
                  )}
                  {returnNote.id === o._id && returnNote.text && <p className="mt-2 text-xs text-gold">{returnNote.text}</p>}
                </div>
              </article>
            ))}
          </InViewGroup>
        )}
      </div>
    </div>
  );
}
