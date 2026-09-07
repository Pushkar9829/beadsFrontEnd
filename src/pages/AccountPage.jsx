import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Price from '../components/ui/Price';
import Spinner from '../components/ui/Spinner';

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl gold-text">Account</h1>
          <p className="mt-1 text-lilac">{user?.name} · {user?.email}</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && <Button to="/admin" variant="ghost">Admin</Button>}
          <Button variant="ghost" onClick={async () => { await logout(); onLogout(); }}>Sign out</Button>
        </div>
      </div>
      {placed && (
        <p className="mt-6 rounded-2xl p-4 text-sm text-gold gold-border">
          Order {placed} is held as pending payment. Gateway checkout arrives in the next release.
        </p>
      )}
      <h2 className="mt-10 font-serif text-2xl">Orders</h2>
      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <p className="mt-4 text-lilac">No orders yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="rounded-2xl p-4 gold-border">
              <div className="flex justify-between">
                <span className="font-serif text-lg">{o.orderNumber}</span>
                <span className="text-xs uppercase tracking-widest text-gold">{o.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-lilac">{new Date(o.createdAt).toLocaleString('en-IN')} · <Price value={o.total} /></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
