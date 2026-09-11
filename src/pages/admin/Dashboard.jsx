import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Price from '../../components/ui/Price';
import StatusBadge from '../../components/admin/StatusBadge';
import { FilterSelect } from '../../components/admin/AdminToolbar';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

function Tile({ label, value, to, money }) {
  const inner = (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-widest text-lilac">{label}</p>
      <p className="mt-1.5 font-serif text-2xl text-gold">
        {money ? <Price value={value ?? 0} /> : (value ?? '—')}
      </p>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function SparkBars({ series }) {
  const max = Math.max(1, ...series.map((s) => s.sales || 0));
  return (
    <div className="flex h-40 items-end gap-1">
      {series.map((s) => (
        <div key={s.date} className="group relative flex-1">
          <div
            className="w-full rounded-t bg-gold/70 hover:bg-gold"
            style={{ height: `${Math.max(4, (s.sales / max) * 100)}%` }}
            title={`${s.date}: ₹${Math.round(s.sales)}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ analytics = false }) {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/admin/dashboard?range=${range}`).then(({ data: d }) => setData(d)).catch(() => {});
  }, [range]);

  const k = data?.kpis || {};
  const actions = data?.actions || {};

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl gold-text">{analytics ? 'Analytics' : 'Dashboard'}</h1>
          <p className="mt-1 text-xs text-lilac">
            {analytics ? 'Sales, AOV, and what needs attention.' : 'Today’s pulse and items that need a decision.'}
          </p>
        </div>
        <FilterSelect value={range} onChange={setRange} options={RANGES} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Today’s sales" value={k.salesToday} money />
        <Tile label="Today’s orders" value={k.ordersToday} to="/admin/orders" />
        <Tile label="New customers" value={k.customersToday} to="/admin/customers" />
        <Tile label="Average order value" value={k.aov} money />
        <Tile label="Pending orders" value={k.pending} to="/admin/orders/pending_payment" />
        <Tile label="Processing" value={k.processing} to="/admin/orders/processing" />
        <Tile label="Low stock" value={k.lowStock} to="/admin/inventory/low" />
        <Tile label="Out of stock" value={k.outOfStock} to="/admin/inventory" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg gold-text">Sales</h2>
            <span className="text-xs text-lilac"><Price value={k.salesRange} /> in range</span>
          </div>
          {data?.salesSeries?.length ? <SparkBars series={data.salesSeries} /> : <p className="py-10 text-center text-lilac">No paid orders in this range.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-lg gold-text">Top sellers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.topProducts || []).length === 0 && <li className="text-lilac">No sales yet.</li>}
            {(data?.topProducts || []).map((p) => (
              <li key={p.name} className="flex justify-between gap-3">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-gold"><Price value={p.revenue} /></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-lg gold-text">Action required</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-widest text-lilac">Low / out of stock</p>
            <ul className="mt-2 space-y-2 text-sm">
              {[...(actions.outOfStock || []), ...(actions.lowStock || [])].slice(0, 6).map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-2">
                  <Link to="/admin/inventory" className="truncate hover:text-gold">{p.name}</Link>
                  <StatusBadge kind="stock" value={p.stock <= 0 ? 'out' : 'low'} />
                </li>
              ))}
              {!(actions.lowStock || []).length && !(actions.outOfStock || []).length && <li className="text-lilac">Stock looks healthy.</li>}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-widest text-lilac">Pending payment</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(actions.pendingOrders || []).map((o) => (
                <li key={o._id} className="flex justify-between gap-2">
                  <Link to="/admin/orders/pending_payment" className="hover:text-gold">{o.orderNumber}</Link>
                  <Price value={o.total} />
                </li>
              ))}
              {!(actions.pendingOrders || []).length && <li className="text-lilac">Nothing waiting on payment.</li>}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-widest text-lilac">Missing images</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(actions.missingImages || []).map((p) => (
                <li key={p._id}><Link to="/admin/products" className="hover:text-gold">{p.name}</Link></li>
              ))}
              {!(actions.missingImages || []).length && <li className="text-lilac">Every product has an image.</li>}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-widest text-lilac">Abandoned carts</p>
            <p className="mt-2 font-serif text-2xl text-gold">{actions.abandonedCarts ?? 0}</p>
            <Link to="/admin/abandoned-carts" className="mt-2 inline-block text-xs uppercase tracking-widest text-gold">Review</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
