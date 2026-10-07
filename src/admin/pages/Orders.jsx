import { Link, useNavigate } from 'react-router-dom';
import { Download, ShoppingBag, X } from 'lucide-react';
import { useApiList } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { ORDER_STATUSES, ORDER_STATUS_META, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META } from '../lib/status';
import { dateTime, money, number, plural, relative } from '../lib/format';
import { Badge, Button, DataTable, EmptyState, FilterSelect, Input, PageHeader, Pagination, SearchInput, Segmented, StatusBadge, Toolbar } from '../ui';
import { customerName, dayToIso, todayInput, useCsvDownload } from './sales/helpers';

const DEFAULTS = { status: 'all', q: '', payment: 'all', method: 'all', from: '', to: '', sort: '-createdAt', page: 1 };

const PAYMENT_OPTIONS = [{ value: 'all', label: 'Any payment' }, ...Object.entries(PAYMENT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))];
const METHOD_OPTIONS = [{ value: 'all', label: 'Any method' }, ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))];

export default function Orders() {
  const navigate = useNavigate();
  const [state, set] = useUrlState(DEFAULTS);
  const { download, busy } = useCsvDownload();

  const status = state.status === 'all' || ORDER_STATUSES.includes(state.status) ? state.status : 'all';
  const rangeError = state.from && state.to && state.from > state.to ? 'The start date must be on or before the end date.' : null;
  const filters = {
    status,
    q: state.q.trim(),
    paymentStatus: state.payment,
    paymentMethod: state.method,
    from: rangeError ? undefined : dayToIso(state.from),
    to: rangeError ? undefined : dayToIso(state.to, true),
    sort: state.sort,
  };
  const list = useApiList('/orders/admin/all', { ...filters, page: state.page, limit: 25 }, { key: 'orders' });
  const counts = list.raw?.statusCounts || {};

  const sort = { key: state.sort.replace(/^-/, ''), dir: state.sort.startsWith('-') ? 'desc' : 'asc' };
  const onSort = (key) => {
    const dir = sort.key === key && sort.dir === 'desc' ? 'asc' : 'desc';
    set({ sort: `${dir === 'desc' ? '-' : ''}${key}` });
  };

  const filtered = Boolean(filters.q || state.payment !== 'all' || state.method !== 'all' || state.from || state.to);

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (o) => (
        <div>
          <p className="flex flex-wrap items-center gap-1.5 font-medium">
            <Link to={`/admin/orders/${o._id}`} onClick={(e) => e.stopPropagation()} className="hover:text-gold">
              {o.orderNumber}
            </Link>
            {o.inventory?.oversold && <Badge tone="danger">Oversold</Badge>}
          </p>
          <p className="text-xs text-lilac">{plural((o.items || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0), 'item')}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div className="min-w-0 max-w-[14rem]">
          <p className="truncate">{customerName(o)}</p>
          <p className="truncate text-xs text-lilac">{o.email || o.userId?.email || o.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed',
      sortable: true,
      hideBelow: 'md',
      render: (o) => (
        <span className="whitespace-nowrap text-xs text-lilac" title={dateTime(o.createdAt)}>
          {relative(o.createdAt)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge meta={ORDER_STATUS_META} value={o.status} /> },
    {
      key: 'payment',
      header: 'Payment',
      hideBelow: 'sm',
      render: (o) => (
        <div className="space-y-0.5">
          <StatusBadge meta={PAYMENT_STATUS_META} value={o.payment?.status || 'pending'} />
          <p className="text-[11px] text-lilac">{PAYMENT_METHOD_LABELS[o.payment?.method] || '—'}</p>
        </div>
      ),
    },
    { key: 'total', header: 'Total', sortable: true, align: 'right', render: (o) => <span className="tabular-nums">{money(o.total)}</span> },
  ];

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    download('/orders/admin/export', filters, `orders-${status === 'all' ? 'all' : status}-${stamp}.csv`);
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Find an order, check its payment and move it through fulfilment."
        meta={counts.all != null && <Badge>{number(counts.all)}</Badge>}
        actions={
          <Button icon={Download} loading={Boolean(busy)} disabled={Boolean(rangeError)} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <Segmented
        className="mb-3"
        value={status}
        onChange={(v) => set({ status: v })}
        items={[
          { value: 'all', label: 'All', count: counts.all },
          ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label, count: counts[s] ?? (counts.all != null ? 0 : undefined) })),
        ]}
      />

      <Toolbar
        right={
          filtered && (
            <Button variant="ghost" size="sm" icon={X} onClick={() => set({ q: '', payment: 'all', method: 'all', from: '', to: '' })}>
              Clear filters
            </Button>
          )
        }
      >
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Order no., name, email, phone…" />
        <FilterSelect label="Payment status" value={state.payment} onChange={(payment) => set({ payment })} options={PAYMENT_OPTIONS} />
        <FilterSelect label="Payment method" value={state.method} onChange={(method) => set({ method })} options={METHOD_OPTIONS} />
        <div className="flex items-center gap-1.5">
          <Input type="date" aria-label="Placed from" value={state.from} max={state.to || todayInput()} onChange={(e) => set({ from: e.target.value })} className="w-auto" />
          <span className="text-xs text-lilac">–</span>
          <Input type="date" aria-label="Placed to" value={state.to} min={state.from || undefined} max={todayInput()} onChange={(e) => set({ to: e.target.value })} className="w-auto" />
        </div>
      </Toolbar>
      {rangeError && <p className="mb-3 text-xs text-amber-200">{rangeError} The date filter is ignored until it is fixed.</p>}

      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
        sort={sort}
        onSort={onSort}
        empty={
          <EmptyState
            icon={ShoppingBag}
            title={filtered || status !== 'all' ? 'No orders match these filters' : 'No orders yet'}
            description={filtered || status !== 'all' ? 'Try another status, search or date range.' : 'Orders placed on the storefront will appear here.'}
            action={
              (filtered || status !== 'all') && (
                <Button size="sm" onClick={() => set({ status: 'all', q: '', payment: 'all', method: 'all', from: '', to: '' })}>
                  Show all orders
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
    </>
  );
}
