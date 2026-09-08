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

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Account' },
];

export default function AccountPage() {
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
      <div className="relative shell py-10 sm:py-12 md:py-16">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
          <SectionHead
            eyebrow="The atelier"
            title="Account"
            body={user ? `${user.name} · ${user.email}` : 'Your orders and atelier stay under one name.'}
            to="/shop"
            action="Shop all →"
          />
          <article className="auth-card">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Session</p>
            <h2 className="mt-2 font-serif text-2xl gold-text">Your house.</h2>
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
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Placed</p>
            <p className="mt-2 text-sm leading-relaxed text-lilac">
              Order {placed} is held as pending payment. Gateway checkout arrives in the next release.
            </p>
          </article>
        )}

        <div className="mt-12 sm:mt-16">
          <SectionHead
            eyebrow="The collection"
            title="Orders"
            body={
              loading
                ? 'Fetching your orders.'
                : orders.length
                  ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} held in the atelier.`
                  : 'No orders yet. Begin a custom strand or walk the houses.'
            }
            to="/customize"
            action="Customization →"
          />
        </div>

        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <InViewGroup className="finale-stage mt-10">
            <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
              <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">No orders yet.</h2>
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                Begin a custom strand, or choose a ready-made piece from the houses.
              </p>
              <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
              </div>
            </div>
          </InViewGroup>
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
