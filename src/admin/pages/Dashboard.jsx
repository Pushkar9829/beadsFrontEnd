import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeIndianRupee,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  ImageOff,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useApiList, useApiQuery } from '../lib/query';
import { ORDER_STATUS_META, PAYMENT_STATUS_META, RETURN_STATUS_META } from '../lib/status';
import { date, money, number, plural, relative } from '../lib/format';
import { Badge, Card, CardHeader, ErrorState, PageHeader, Skeleton, Stat, StatusBadge, Thumb } from '../ui';
import { mediaUrl } from '../../api/client';
import { BarList, RangePicker, SeriesChart } from './sales/components';
import { NOTIFICATION_TYPES, customerName, notificationTarget, useReportRange } from './sales/helpers';

export default function Dashboard() {
  const range = useReportRange('30d');
  const dash = useApiQuery('/admin/dashboard', range.params || {}, { enabled: Boolean(range.params) });
  // Recent orders; statusCounts (unfiltered) also feeds the fulfilment checklist.
  const recent = useApiList('/orders/admin/all', { limit: 8, page: 1 }, { key: 'orders' });
  const returns = useApiList('/admin/returns', { status: 'requested', limit: 5, page: 1 }, { key: 'returns' });
  // Notifications have no type filter: read unread ones and pick the alerts that need a person.
  const alerts = useApiQuery('/admin/notifications', { unread: 'true', limit: 100 });

  const d = dash.data || {};
  const k = d.kpis || {};
  const actions = d.actions || {};
  const loading = dash.isLoading || !range.params;
  const counts = recent.raw?.statusCounts || {};

  const urgent = (alerts.data?.notifications || []).filter(
    (n) => n.type === 'refund_required' || (n.type === 'out_of_stock' && n.meta?.orderId) || n.type === 'payment_failed'
  );

  const checklist = [
    { key: 'paid', label: 'Paid — start processing', count: counts.paid, to: '/admin/orders?status=paid', icon: CreditCard },
    { key: 'processing', label: 'Processing — pack them', count: counts.processing, to: '/admin/orders?status=processing', icon: ClipboardList },
    { key: 'packed', label: 'Packed — ready to ship', count: counts.packed, to: '/admin/orders?status=packed', icon: PackageCheck },
    { key: 'pending_payment', label: 'Awaiting payment', count: counts.pending_payment ?? k.pending, to: '/admin/orders?status=pending_payment', icon: CircleDollarSign },
    { key: 'returns', label: 'Return requests to review', count: returns.pagination.total, to: '/admin/returns?status=requested', icon: RotateCcw },
    { key: 'carts', label: 'Abandoned carts', count: actions.abandonedCarts, to: '/admin/abandoned-carts', icon: ShoppingCart },
  ];

  const stockRows = [...(actions.outOfStock || []).map((p) => ({ ...p, out: true })), ...(actions.lowStock || [])];

  return (
    <>
      <PageHeader title="Dashboard" description="How the shop is doing and what needs attention today." actions={<RangePicker range={range} />} />

      {dash.error && !loading ? (
        <Card className="mb-6">
          <ErrorState error={dash.error} onRetry={dash.refetch} />
        </Card>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label={`Revenue · ${range.label}`} value={money(k.salesRange)} hint="Paid orders only" icon={BadgeIndianRupee} loading={loading} />
          <Stat label={`Orders · ${range.label}`} value={number(k.ordersRange)} hint="All statuses" icon={ShoppingBag} loading={loading} to="/admin/orders" tone="violet" />
          <Stat label="Average order value" value={money(k.aov)} hint={range.label} icon={CircleDollarSign} loading={loading} tone="sky" />
          <Stat
            label="Customers"
            value={number(d.counts?.users)}
            hint={k.customersToday ? `+${number(k.customersToday)} today` : 'None new today'}
            icon={Users}
            loading={loading}
            to="/admin/customers"
            tone="green"
          />
          <Stat label="Sales today" value={money(k.salesToday)} hint={`${plural(k.paidToday || 0, 'paid order')} · ${plural(k.ordersToday || 0, 'order')} placed`} icon={BadgeIndianRupee} loading={loading} />
          <Stat label="To fulfil" value={number(k.processing)} hint="Paid, processing or packed" icon={PackageCheck} loading={loading} to="/admin/orders?status=paid" tone="violet" />
          <Stat label="Awaiting payment" value={number(k.pending)} hint="Unpaid orders" icon={CreditCard} loading={loading} to="/admin/orders?status=pending_payment" tone="sky" />
          <Stat
            label="Stock alerts"
            value={number((k.lowStock || 0) + (k.outOfStock || 0))}
            hint={`${number(k.outOfStock)} out · ${number(k.lowStock)} low`}
            icon={Boxes}
            loading={loading}
            to="/admin/inventory?stock=low"
            tone="rose"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Sales" description={`Paid orders per day · ${range.label}`} actions={!loading && <span className="text-sm tabular-nums text-ivory">{money(k.salesRange)}</span>} />
            {loading ? (
              <Skeleton className="h-44 w-full" />
            ) : (d.salesSeries || []).some((s) => s.sales > 0) ? (
              <SeriesChart series={d.salesSeries} label="Paid sales by day" />
            ) : (
              <p className="py-12 text-center text-sm text-lilac">No paid orders in this range.</p>
            )}
          </Card>

          <Card padded={false}>
            <div className="p-5 pb-0">
              <CardHeader
                title="Recent orders"
                actions={
                  <Link to="/admin/orders" className="text-xs text-gold hover:underline">
                    View all
                  </Link>
                }
              />
            </div>
            {recent.isLoading ? (
              <div className="space-y-2 p-5 pt-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recent.error ? (
              <ErrorState error={recent.error} onRetry={recent.refetch} />
            ) : recent.rows.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-lilac">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {recent.rows.slice(0, 8).map((o) => (
                  <li key={o._id}>
                    <Link to={`/admin/orders/${o._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-ivory">{o.orderNumber}</span>
                          {o.inventory?.oversold && <Badge tone="danger">Oversold</Badge>}
                        </p>
                        <p className="truncate text-xs text-lilac">
                          {customerName(o)} · {relative(o.createdAt)}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <StatusBadge meta={ORDER_STATUS_META} value={o.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm tabular-nums text-ivory">{money(o.total)}</p>
                        <p className="text-[11px] text-lilac">{PAYMENT_STATUS_META[o.payment?.status]?.label || '—'}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Top products" description={`By revenue · ${range.label}`} />
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <BarList
                rows={(d.topProducts || []).map((p) => ({ key: p.name, label: p.name, value: p.revenue, hint: `${number(p.qty)} sold` }))}
                empty="No sales in this range."
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Needs attention" />
            {urgent.length > 0 && (
              <ul className="mb-4 space-y-2">
                {urgent.slice(0, 6).map((n) => {
                  const to = notificationTarget(n);
                  const meta = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.system;
                  const body = (
                    <div className="flex gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-3">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-300" />
                      <div className="min-w-0">
                        <p className="text-sm text-ivory">{n.title}</p>
                        <p className="mt-0.5 text-xs text-lilac">
                          {meta.label} · {relative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return <li key={n._id}>{to ? <Link to={to}>{body}</Link> : body}</li>;
                })}
                {urgent.length > 6 && (
                  <li>
                    <Link to="/admin/notifications?filter=unread" className="text-xs text-gold hover:underline">
                      {plural(urgent.length - 6, 'more alert')}
                    </Link>
                  </li>
                )}
              </ul>
            )}
            <ul className="divide-y divide-white/[0.05]">
              {checklist.map(({ key, label, count, to, icon: Icon }) => (
                <li key={key}>
                  <Link to={to} className="flex items-center gap-3 py-2.5 text-sm hover:text-gold">
                    <Icon size={15} className="shrink-0 text-lilac" />
                    <span className="flex-1 text-ivory">{label}</span>
                    {count == null ? <Skeleton className="h-4 w-6" /> : <Badge tone={count > 0 ? 'gold' : 'neutral'}>{number(count)}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Pending returns" actions={<Link to="/admin/returns?status=requested" className="text-xs text-gold hover:underline">View all</Link>} />
            {returns.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : returns.error ? (
              <ErrorState error={returns.error} onRetry={returns.refetch} />
            ) : returns.rows.length === 0 ? (
              <p className="text-sm text-lilac">No return requests waiting.</p>
            ) : (
              <ul className="space-y-2.5">
                {returns.rows.map((r) => (
                  <li key={r._id}>
                    <Link to={`/admin/returns?q=${encodeURIComponent(r.orderId?.orderNumber || '')}`} className="flex items-center justify-between gap-3 text-sm hover:text-gold">
                      <span className="min-w-0">
                        <span className="block truncate text-ivory">{r.orderId?.orderNumber || 'Order'}</span>
                        <span className="block truncate text-xs text-lilac">
                          {r.type === 'exchange' ? 'Exchange' : 'Return'} · {r.userId?.name || r.orderId?.contactName || '—'} · {date(r.createdAt)}
                        </span>
                      </span>
                      <StatusBadge meta={RETURN_STATUS_META} value={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Low stock" actions={<Link to="/admin/inventory?stock=low" className="text-xs text-gold hover:underline">Inventory</Link>} />
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : stockRows.length === 0 ? (
              <p className="text-sm text-lilac">Stock looks healthy.</p>
            ) : (
              <ul className="space-y-2.5">
                {stockRows.slice(0, 8).map((p) => (
                  <li key={p._id}>
                    <Link to={`/admin/products/${p._id}`} className="flex items-center gap-3 text-sm hover:text-gold">
                      <Thumb src={mediaUrl(p.images?.[0]?.url || p.images?.[0] || '')} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ivory">{p.name}</span>
                        {p.sku && <span className="block text-xs text-lilac">{p.sku}</span>}
                      </span>
                      {p.out || p.stock <= 0 ? <Badge tone="danger">Out</Badge> : <Badge tone="warning">{number(p.stock)} left</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!loading && (actions.missingImages || []).length > 0 && (
            <Card>
              <CardHeader title="Products without images" />
              <ul className="space-y-2">
                {actions.missingImages.map((p) => (
                  <li key={p._id}>
                    <Link to={`/admin/products/${p._id}`} className="flex items-center gap-2 text-sm text-ivory hover:text-gold">
                      <ImageOff size={14} className="shrink-0 text-lilac" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
