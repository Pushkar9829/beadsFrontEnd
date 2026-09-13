import { useEffect, useState } from 'react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Price from '../../components/ui/Price';
import { FilterSelect } from '../../components/admin/AdminToolbar';
import Button from '../../components/ui/Button';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
  { value: '1y', label: '1 year' },
  { value: 'custom', label: 'Custom' },
];

function Tile({ label, value, money, suffix }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-widest text-lilac">{label}</p>
      <p className="mt-1.5 font-serif text-2xl text-gold">
        {money ? <Price value={value ?? 0} /> : `${value ?? '—'}${suffix || ''}`}
      </p>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (range === 'custom' && from && to) {
      qs.set('from', from);
      qs.set('to', to);
    } else if (range !== 'custom') qs.set('range', range);
    else return;
    api.get(`/admin/analytics?${qs}`).then(({ data: d }) => setData(d)).catch(() => {});
  }, [range, from, to]);

  const k = data?.kpis || {};

  function download(kind) {
    const qs = new URLSearchParams({ kind });
    if (range === 'custom' && from && to) {
      qs.set('from', from);
      qs.set('to', to);
    } else qs.set('range', range === 'custom' ? '30d' : range);
    api.get(`/admin/analytics/export?${qs}`, { responseType: 'blob' }).then(({ data: blob }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl gold-text">Analytics</h1>
          <p className="mt-1 text-xs text-lilac">Revenue, conversion, categories, and coupon performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={range} onChange={setRange} options={RANGES} />
          {range === 'custom' && (
            <>
              <input type="date" className="rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" className="rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Revenue" value={k.revenue} money />
        <Tile label="Orders" value={k.orders} />
        <Tile label="New customers" value={k.customers} />
        <Tile label="Average order value" value={k.aov} money />
        <Tile label="Conversion rate" value={k.conversionRate} suffix="%" />
        <Tile label="Repeat customer rate" value={k.repeatRate} suffix="%" />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => download('orders')}>Export orders</Button>
        <Button variant="ghost" onClick={() => download('products')}>Export products</Button>
        <Button variant="ghost" onClick={() => download('coupons')}>Export coupons</Button>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-serif text-lg gold-text">Best sellers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.bestSellers || []).map((p) => (
              <li key={p.name} className="flex justify-between gap-3"><span className="truncate">{p.name}</span><Price value={p.revenue} /></li>
            ))}
            {!data?.bestSellers?.length && <li className="text-lilac">No sales in range.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-lg gold-text">Worst sellers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.worstSellers || []).map((p) => (
              <li key={p.name} className="flex justify-between gap-3"><span className="truncate">{p.name}</span><Price value={p.revenue} /></li>
            ))}
            {!data?.worstSellers?.length && <li className="text-lilac">No sales in range.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-lg gold-text">Revenue by category</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.categories || []).map((c) => (
              <li key={c.categoryId} className="flex justify-between gap-3"><span>{c.name}</span><Price value={c.revenue} /></li>
            ))}
            {!data?.categories?.length && <li className="text-lilac">No category sales yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-lg gold-text">Coupon performance</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.coupons || []).map((c) => (
              <li key={c.code} className="flex justify-between gap-3">
                <span>{c.code} · {c.usedCount} uses</span>
                <span className="text-gold"><Price value={c.revenueGenerated} /></span>
              </li>
            ))}
            {!data?.coupons?.length && <li className="text-lilac">No coupons used.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
