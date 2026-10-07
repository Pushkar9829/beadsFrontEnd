import { useMemo, useState } from 'react';
import { BadgeIndianRupee, CircleDollarSign, Download, Percent, Repeat, ShoppingBag, ShoppingCart, Ticket, Users } from 'lucide-react';
import { useApiQuery } from '../lib/query';
import { money, number } from '../lib/format';
import { Button, Card, CardHeader, DataTable, EmptyState, ErrorState, Menu, PageHeader, Skeleton, Stat, nextSort, sortRows } from '../ui';
import { BarList, RangePicker } from './sales/components';
import { useCsvDownload, useReportRange } from './sales/helpers';

const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

export default function Analytics() {
  const range = useReportRange('30d');
  const report = useApiQuery('/admin/analytics', range.params || {}, { enabled: Boolean(range.params) });
  const { download, busy } = useCsvDownload();
  const [couponSort, setCouponSort] = useState({ key: 'revenueGenerated', dir: 'desc' });

  const d = report.data || {};
  const k = d.kpis || {};
  const loading = report.isLoading || !range.params;

  // The API returns the bottom 10 even when there are fewer than 20 products; drop overlaps.
  const best = d.bestSellers || [];
  const worst = useMemo(() => {
    const bestNames = new Set((d.bestSellers || []).map((p) => p.name));
    return (d.worstSellers || []).filter((p) => !bestNames.has(p.name));
  }, [d.bestSellers, d.worstSellers]);

  const exportCsv = (kind) => {
    if (!range.params) return;
    const stamp = range.params.range || `${range.params.from}_${range.params.to}`;
    download('/admin/analytics/export', { kind, ...range.params }, `${kind}-${stamp}.csv`, kind);
  };

  const coupons = sortRows(d.coupons || [], couponSort);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue, conversion, best sellers and coupon performance."
        actions={<RangePicker range={range} />}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-lilac">
          Showing <span className="text-ivory">{range.label}</span>. Revenue counts paid orders only.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" icon={Download} loading={busy === 'orders'} disabled={!range.params || Boolean(busy)} onClick={() => exportCsv('orders')}>
            Export orders
          </Button>
          <Menu
            label="More exports"
            items={[
              { label: busy === 'products' ? 'Exporting…' : 'Export best sellers', icon: Download, disabled: !range.params || Boolean(busy), onClick: () => exportCsv('products') },
              { label: busy === 'coupons' ? 'Exporting…' : 'Export coupons (all time)', icon: Download, disabled: !range.params || Boolean(busy), onClick: () => exportCsv('coupons') },
            ]}
          />
        </div>
      </div>

      {report.error && !loading ? (
        <Card>
          <ErrorState error={report.error} onRetry={report.refetch} />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Revenue" value={money(k.revenue)} hint={range.label} icon={BadgeIndianRupee} loading={loading} />
            <Stat label="Paid orders" value={number(k.orders)} hint={range.label} icon={ShoppingBag} loading={loading} tone="violet" to="/admin/orders" />
            <Stat label="Average order value" value={money(k.aov)} icon={CircleDollarSign} loading={loading} tone="sky" />
            <Stat label="New customers" value={number(k.customers)} hint={`${number(k.allCustomers)} in total`} icon={Users} loading={loading} tone="green" to="/admin/customers" />
            <Stat label="Conversion rate" value={pct(k.conversionRate)} hint="Paid orders ÷ (orders + abandoned carts), approx." icon={Percent} loading={loading} tone="violet" />
            <Stat label="Repeat customer rate" value={pct(k.repeatRate)} hint="All time" icon={Repeat} loading={loading} tone="green" />
            <Stat label="Abandoned carts" value={number(k.abandoned)} hint="Right now" icon={ShoppingCart} loading={loading} tone="rose" to="/admin/abandoned-carts" />
            <Stat label="Coupons in use" value={number((d.coupons || []).filter((c) => c.usedCount > 0).length)} hint="All time" icon={Ticket} loading={loading} to="/admin/coupons" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Best sellers" description="Top 10 by revenue in this range" />
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <BarList
                  rows={best.map((p, i) => ({ key: `${p.name}-${i}`, label: p.name, value: p.revenue, hint: `${number(p.qty)} sold` }))}
                  empty="No sales in this range."
                />
              )}
            </Card>
            <Card>
              <CardHeader title="Slow sellers" description="Lowest revenue among products that sold in this range" />
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <BarList
                  tone="rose"
                  rows={worst.map((p, i) => ({ key: `${p.name}-${i}`, label: p.name, value: p.revenue, hint: `${number(p.qty)} sold` }))}
                  empty={best.length ? 'Every product that sold is already in the best sellers.' : 'No sales in this range.'}
                />
              )}
            </Card>
            <Card>
              <CardHeader title="Revenue by category" description={range.label} />
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <BarList
                  tone="violet"
                  rows={[...(d.categories || [])]
                    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                    .map((c, i) => ({ key: c.categoryId || `c${i}`, label: c.name || 'Uncategorised', value: c.revenue, hint: c.qty != null ? `${number(c.qty)} sold` : undefined }))}
                  empty="No category sales in this range."
                />
              )}
            </Card>
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-ivory">Coupon performance</h3>
                <span className="text-xs text-lilac">All time</span>
              </div>
              <DataTable
                dense
                columns={[
                  { key: 'code', header: 'Code', sortable: true, render: (c) => <span className="font-mono text-xs">{c.code}</span> },
                  { key: 'usedCount', header: 'Uses', sortable: true, align: 'right', render: (c) => number(c.usedCount) },
                  { key: 'revenueGenerated', header: 'Revenue', sortable: true, align: 'right', render: (c) => money(c.revenueGenerated) },
                  { key: 'discountCost', header: 'Discount given', sortable: true, align: 'right', render: (c) => money(c.discountCost) },
                ]}
                rows={coupons}
                rowKey={(c) => c.code}
                loading={loading}
                sort={couponSort}
                onSort={(key) => setCouponSort(nextSort(couponSort, key))}
                empty={<EmptyState icon={Ticket} title="No coupons yet" />}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
