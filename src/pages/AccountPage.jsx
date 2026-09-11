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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
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
              {user?.role === 'admin' && (
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
                </div>
              </article>
            ))}
          </InViewGroup>
        )}
      </div>
    </div>
  );
}
