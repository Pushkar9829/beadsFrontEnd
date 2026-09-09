import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Card from '../../components/ui/Card';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(() => {});
  }, []);
  const tiles = [
    ['Users', stats?.users, '/admin/users'],
    ['Products', stats?.products, '/admin/products'],
    ['Beads', stats?.beads, '/admin/beads'],
    ['Pending orders', stats?.pendingOrders, '/admin/orders'],
    ['Low stock', stats?.lowStock, '/admin/products'],
  ];
  return (
    <div>
      <h1 className="font-serif text-2xl gold-text">Dashboard</h1>
      <p className="mt-1 text-xs text-lilac">Atelier snapshot. Open a module from the sidebar or a tile.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(([label, value, to]) => (
          <Link key={label} to={to}>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-lilac">{label}</p>
              <p className="mt-1.5 font-serif text-2xl text-gold">{value ?? '—'}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
