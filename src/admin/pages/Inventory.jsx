import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, History, PackageCheck, SlidersHorizontal, X } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, number, relative } from '../lib/format';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  FilterSelect,
  Input,
  Menu,
  Modal,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Tabs,
  Thumb,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { StockCell } from './catalog/shared';

const INVALIDATE = ['/admin/inventory', '/products/admin', '/admin/dashboard', '/customizer/admin/beads', '/admin/featured'];
const REASONS = [
  { value: 'Restock', label: 'Restock / new delivery' },
  { value: 'Stock count correction', label: 'Stock count correction' },
  { value: 'Damaged or lost', label: 'Damaged or lost' },
  { value: 'Customer return', label: 'Customer return' },
  { value: 'Other', label: 'Other' },
];
const KINDS = [
  { value: 'product', label: 'Products' },
  { value: 'bead', label: 'Beads' },
];
const HISTORY_PAGE = 25;

export default function Inventory() {
  const [state, set] = useUrlState({ tab: 'stock', q: '', stock: 'all', kind: 'product', sort: 'name', page: 1, productId: '', beadId: '', label: '' });
  return (
    <>
      <PageHeader title="Inventory" description="Stock levels for products and beads. Every change is logged with a reason." />
      <Tabs
        value={state.tab}
        onChange={(tab) => set({ tab, page: 1, productId: '', beadId: '', label: '' })}
        items={[
          { value: 'stock', label: 'Stock', icon: Boxes },
          { value: 'history', label: 'History', icon: History },
        ]}
      />
      {state.tab === 'history' ? <HistoryTab state={state} set={set} /> : <StockTab state={state} set={set} />}
    </>
  );
}

function StockTab({ state, set }) {
  const navigate = useNavigate();
  const [adjusting, setAdjusting] = useState(null);
  const isBead = state.kind === 'bead';
  const list = useApiList(
    '/admin/inventory',
    { kind: state.kind, view: state.stock, q: state.q, sort: state.sort, page: state.page, limit: 50 },
    { key: 'items' }
  );
  const filtered = Boolean(state.q || state.stock !== 'all');

  const columns = [
    {
      key: 'name',
      header: isBead ? 'Bead' : 'Product',
      sortable: true,
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={mediaUrl(p.images?.[0] || p.image || '')} color={p.colorHex} size={36} />
          <div className="min-w-0">
            <div className="truncate font-medium">{p.name}</div>
            <div className="truncate text-xs text-lilac">{isBead ? p.slug : p.sku || 'No SKU'}</div>
          </div>
        </div>
      ),
    },
    ...(isBead ? [] : [{ key: 'category', header: 'Category', hideBelow: 'md', render: (p) => p.categoryId?.name || '—' }]),
    { key: 'stock', header: 'In stock', sortable: true, render: (p) => <StockCell product={p} /> },
    { key: 'lowStockLimit', header: 'Alert at', hideBelow: 'sm', align: 'right', render: (p) => number(p.lowStockLimit) },
    { key: 'updatedAt', header: 'Updated', hideBelow: 'lg', sortable: true, render: (p) => <span className="text-lilac">{relative(p.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" icon={SlidersHorizontal} onClick={() => setAdjusting(p)}>
            Adjust
          </Button>
          <Menu
            items={[
              { label: 'View history', icon: History, onClick: () => set({ tab: 'history', [isBead ? 'beadId' : 'productId']: p._id, label: p.name }) },
              !isBead && { label: 'Edit product', icon: PackageCheck, onClick: () => navigate(`/admin/products/${p._id}`) },
            ]}
          />
        </div>
      ),
    },
  ];

  const sortObj = state.sort.startsWith('-') ? { key: state.sort.slice(1), dir: 'desc' } : { key: state.sort, dir: 'asc' };

  return (
    <>
      <Toolbar>
        <Segmented items={KINDS} value={state.kind} onChange={(kind) => set({ kind })} />
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder={isBead ? 'Search beads…' : 'Search name or SKU…'} />
        <FilterSelect
          label="Stock level"
          value={state.stock}
          onChange={(stock) => set({ stock })}
          options={[
            { value: 'all', label: 'All stock levels' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ]}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setAdjusting}
        sort={sortObj}
        onSort={(key) => {
          const dir = sortObj.key === key ? (sortObj.dir === 'asc' ? 'desc' : 'asc') : key === 'name' ? 'asc' : key === 'stock' ? 'asc' : 'desc';
          set({ sort: dir === 'desc' ? `-${key}` : key });
        }}
        empty={
          <EmptyState
            icon={Boxes}
            title={state.stock === 'low' ? 'Nothing is running low' : state.stock === 'out' ? 'Nothing is out of stock' : filtered ? 'No matches' : `No ${isBead ? 'beads' : 'products'} yet`}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <AdjustModal key={adjusting?._id || 'none'} item={adjusting} kind={state.kind} rows={list.rows} onClose={() => setAdjusting(null)} />
    </>
  );
}

function AdjustModal({ item, kind, rows, onClose }) {
  const confirm = useConfirm();
  const form = useForm({ mode: 'delta', delta: '', target: '', reason: REASONS[0].value, note: '' });
  const v = form.values;
  // Prefer the freshest copy of the row (the list refetches after every adjustment / on focus).
  const live = rows.find((r) => r._id === item?._id) || item;
  const current = Number(live?.stock) || 0;
  const delta = v.mode === 'delta' ? (v.delta === '' ? 0 : Math.trunc(Number(v.delta))) : v.target === '' ? 0 : Math.trunc(Number(v.target)) - current;
  const next = Math.max(0, current + delta);

  const adjust = useApiMutation((body) => apiSend('post', '/admin/inventory/adjust', body), {
    invalidate: INVALIDATE,
    success: (data) => {
      const a = data?.adjustment;
      return a ? `Stock updated: ${number(a.previousStock)} → ${number(a.nextStock)}.` : 'Stock updated.';
    },
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => form.setServerErrors(info.fields),
  });

  const submit = async (e) => {
    e.preventDefault();
    if (adjust.isPending) return; // guard against double submit
    const errs = {};
    if (!delta) errs[v.mode] = v.mode === 'delta' ? 'Enter a non-zero change, e.g. 10 or -3.' : 'The new count equals the current stock.';
    if (Math.abs(delta) > 1_000_000) errs[v.mode] = 'That change is too large.';
    if (v.mode === 'target' && Number(v.target) < 0) errs.target = 'Stock cannot be negative.';
    if (v.reason === 'Other' && !v.note.trim()) errs.note = 'Add a short note.';
    if (Object.keys(errs).length) return form.setErrors(errs);
    if (current + delta < 0) {
      const ok = await confirm({
        title: 'Remove more than is in stock?',
        message: `Stock is ${number(current)}. Removing ${number(-delta)} will set it to 0.`,
        confirmLabel: 'Set to 0',
        tone: 'danger',
      });
      if (!ok) return;
    }
    const reason = [v.reason, v.note.trim()].filter(Boolean).join(': ').slice(0, 500);
    adjust.mutate({ [kind === 'bead' ? 'beadId' : 'productId']: item._id, delta, reason });
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      dirty={form.dirty}
      size="sm"
      title={`Adjust stock — ${item?.name || ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="adjust-form" loading={adjust.isPending} disabled={adjust.isPending || !delta}>
            Apply change
          </Button>
        </>
      }
    >
      <form id="adjust-form" onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2 text-sm">
          <span className="text-lilac">Current stock</span>
          <span className="tabular-nums text-ivory">{number(current)}</span>
        </div>
        <Segmented
          items={[
            { value: 'delta', label: 'Add or remove' },
            { value: 'target', label: 'Set exact count' },
          ]}
          value={v.mode}
          onChange={(mode) => form.set('mode', mode)}
        />
        {v.mode === 'delta' ? (
          <Field label="Change" hint="Positive to add, negative to remove (e.g. 10 or -3)." error={form.errors.delta}>
            {({ id }) => <NumberInput id={id} step={1} autoFocus value={v.delta} onChange={(x) => form.set('delta', x)} invalid={Boolean(form.errors.delta)} />}
          </Field>
        ) : (
          <Field label="New stock count" hint="Use after a physical count." error={form.errors.target}>
            {({ id }) => <NumberInput id={id} min={0} step={1} autoFocus value={v.target} onChange={(x) => form.set('target', x)} invalid={Boolean(form.errors.target)} />}
          </Field>
        )}
        <Field label="Reason" required error={form.errors.reason}>
          {({ id }) => <Select id={id} options={REASONS} {...form.bind('reason')} />}
        </Field>
        <Field label="Note" hint={v.reason === 'Other' ? 'Required for “Other”.' : 'Optional, e.g. supplier invoice number.'} error={form.errors.note}>
          {({ id }) => <Input id={id} maxLength={300} {...form.bind('note')} />}
        </Field>
        {delta !== 0 && (
          <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-ivory">
            {number(current)} → <strong className="tabular-nums">{number(next)}</strong>{' '}
            <span className={delta > 0 ? 'text-emerald-300' : 'text-rose-300'}>
              ({delta > 0 ? '+' : ''}
              {number(delta)})
            </span>
          </p>
        )}
      </form>
    </Modal>
  );
}

function HistoryTab({ state, set }) {
  const list = useApiList(
    '/admin/inventory/history',
    { kind: state.productId || state.beadId ? undefined : state.kind, productId: state.productId, beadId: state.beadId },
    { key: 'history' }
  );
  const all = list.rows;
  const rows = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    if (!q) return all;
    return all.filter((h) => `${h.productId?.name || ''} ${h.productId?.sku || ''} ${h.beadId?.name || ''} ${h.reason || ''} ${h.userId?.name || ''}`.toLowerCase().includes(q));
  }, [all, state.q]);
  const pages = Math.max(1, Math.ceil(rows.length / HISTORY_PAGE));
  const page = Math.min(state.page, pages);
  const slice = rows.slice((page - 1) * HISTORY_PAGE, page * HISTORY_PAGE);
  const scoped = Boolean(state.productId || state.beadId);

  const columns = [
    {
      key: 'item',
      header: 'Item',
      render: (h) => {
        const name = h.productId?.name || h.beadId?.name || 'Deleted item';
        return (
          <div className="min-w-0">
            {h.productId?._id ? (
              <Link to={`/admin/products/${h.productId._id}`} className="truncate font-medium hover:text-gold" onClick={(e) => e.stopPropagation()}>
                {name}
              </Link>
            ) : (
              <span className="truncate font-medium">{name}</span>
            )}
            <div className="text-xs text-lilac">{h.productId ? h.productId.sku || 'Product' : 'Bead'}</div>
          </div>
        );
      },
    },
    {
      key: 'delta',
      header: 'Change',
      align: 'right',
      render: (h) => (
        <span className={`tabular-nums ${h.delta > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {h.delta > 0 ? '+' : ''}
          {number(h.delta)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      hideBelow: 'sm',
      render: (h) => (
        <span className="tabular-nums text-lilac">
          {number(h.previousStock)} → <span className="text-ivory">{number(h.nextStock)}</span>
        </span>
      ),
    },
    { key: 'reason', header: 'Reason', render: (h) => <span className="line-clamp-2">{h.reason || '—'}</span> },
    { key: 'user', header: 'By', hideBelow: 'md', render: (h) => h.userId?.name || h.userId?.email || 'System' },
    { key: 'createdAt', header: 'When', hideBelow: 'sm', render: (h) => <span title={dateTime(h.createdAt)} className="text-lilac">{relative(h.createdAt)}</span> },
  ];

  return (
    <>
      <Toolbar>
        {!scoped && <Segmented items={KINDS} value={state.kind} onChange={(kind) => set({ kind })} />}
        {scoped && (
          <Badge tone="gold" className="h-8 px-3 text-xs">
            {state.label || 'One item'}
            <button type="button" aria-label="Show all items" onClick={() => set({ productId: '', beadId: '', label: '' })} className="ml-1 hover:text-ivory">
              <X size={12} />
            </button>
          </Badge>
        )}
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search item, reason or person…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={slice}
        rowKey={(h) => h._id || `${h.createdAt}-${h.productId?._id || h.beadId?._id}`}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        dense
        empty={<EmptyState icon={History} title={state.q ? 'No changes match' : 'No stock changes yet'} description={!state.q ? 'Adjustments made on the Stock tab appear here.' : undefined} />}
        footer={
          <>
            <Pagination pagination={{ page, pages, total: rows.length, limit: HISTORY_PAGE }} onPage={(p) => set({ page: p })} />
            {all.length >= 200 && <p className="border-t border-white/[0.08] px-4 py-2 text-[11px] text-lilac">Showing the latest 200 changes.</p>}
          </>
        }
      />
    </>
  );
}
