// Flash sales: timed price drops with a storefront countdown. Unpaginated endpoint → filtered client-side.
import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Copy, IndianRupee, Package, Pencil, Plus, Power, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiSend, useApiList, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, fromLocalInput, money, number, plural, toLocalInput } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FormSection,
  IconButton,
  Input,
  Menu,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  Stat,
  Switch,
  Thumb,
  Toolbar,
  cx,
  useConfirm,
  useForm,
} from '../ui';
import { ProductPickerModal } from '../ui/pickers';
import { Countdown, Note, ScheduleBadge, ScheduleFields } from './marketing/components';
import { SALE_META, idOf, paginate, scheduleErrors, scheduleStatus } from './marketing/schedule';

const BASE = '/admin/flash-sales';
const INVALIDATE = [BASE, '/products/admin'];
const PAGE_SIZE = 25;
const EMPTY = { name: '', startsAt: '', endsAt: '', isActive: true, items: [] };
const MODES = [
  { value: 'percent', label: '% off' },
  { value: 'price', label: 'Sale price' },
];

function toForm(s) {
  if (!s) return EMPTY;
  return {
    name: s.name || '',
    startsAt: toLocalInput(s.startsAt),
    endsAt: toLocalInput(s.endsAt),
    isActive: s.isActive !== false,
    items: (s.items || [])
      .filter((i) => i.productId)
      .map((i) =>
        i.salePrice != null
          ? { productId: idOf(i.productId), mode: 'price', value: i.salePrice }
          : { productId: idOf(i.productId), mode: 'percent', value: i.percent ?? '' }
      ),
  };
}

/** Mirrors backend computeSalePrice: sale price wins, percent rounds to the rupee. */
function salePriceOf(item, base) {
  if (item.value === '' || item.value == null) return null;
  if (item.mode === 'price') return Math.max(0, Number(item.value));
  if (base == null) return null;
  return Math.max(0, Math.round(base * (1 - Number(item.value) / 100)));
}

function rowError(item, product) {
  const n = Number(item.value);
  if (item.value === '' || !Number.isFinite(n)) return item.mode === 'price' ? 'Enter a sale price.' : 'Enter a discount.';
  if (item.mode === 'percent' && (n <= 0 || n >= 100)) return 'Use a percentage between 0 and 100.';
  if (item.mode === 'price' && n <= 0) return 'Sale price must be above 0.';
  const base = product?.price;
  if (base != null) {
    const sp = salePriceOf(item, base);
    if (sp != null && sp >= base) return `Must be below the regular price (${money(base)}), or the sale is ignored.`;
  }
  return null;
}

const overlaps = (a, b) => new Date(a.startsAt) <= new Date(b.endsAt) && new Date(b.startsAt) <= new Date(a.endsAt);

export default function FlashSales() {
  const [state, set] = useUrlState({ q: '', status: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | { sale?, initial? }
  const [reportFor, setReportFor] = useState(null);
  const confirm = useConfirm();

  const list = useApiList(BASE, undefined, { key: 'sales' });
  const all = list.rows;

  const counts = useMemo(() => {
    const out = { all: all.length, active: 0, scheduled: 0, expired: 0, inactive: 0 };
    for (const s of all) out[scheduleStatus(s)] += 1;
    return out;
  }, [all]);

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    return all.filter((s) => (state.status === 'all' || scheduleStatus(s) === state.status) && (!q || s.name?.toLowerCase().includes(q)));
  }, [all, state.q, state.status]);
  const { slice, pagination } = paginate(filtered, state.page, PAGE_SIZE);

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: INVALIDATE, success: 'Flash sale deleted.' });
  const toggle = useApiMutation((s) => apiSend('put', `${BASE}/${s._id}`, { isActive: s.isActive === false }), {
    invalidate: INVALIDATE,
    success: (_d, s) => (s.isActive === false ? 'Flash sale switched on.' : 'Flash sale switched off.'),
  });

  const askToggle = async (s) => {
    const live = scheduleStatus(s) === 'active';
    if (live && !(await confirm({ title: `Switch off “${s.name}”?`, message: 'Prices go back to normal on the storefront right away.', confirmLabel: 'Switch off', tone: 'danger' }))) return;
    toggle.mutate(s);
  };

  const askDelete = async (s) => {
    const live = scheduleStatus(s) === 'active';
    if (
      await confirm({
        title: `Delete “${s.name}”?`,
        message: live ? 'This sale is live — prices go back to normal right away and its performance totals are lost.' : 'Its performance totals are lost. Switching it off keeps the record.',
        confirmLabel: 'Delete sale',
        tone: 'danger',
      })
    )
      remove.mutate(s._id);
  };

  const columns = [
    {
      key: 'name',
      header: 'Sale',
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{s.name}</p>
          <p className="text-xs text-lilac">{plural(s.items?.length || 0, 'product')}</p>
        </div>
      ),
    },
    {
      key: 'window',
      header: 'When',
      render: (s) => (
        <div className="text-xs">
          <p className="text-ivory">{dateTime(s.startsAt)}</p>
          <p className="text-lilac">to {dateTime(s.endsAt)}</p>
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      hideBelow: 'md',
      render: (s) => (
        <div>
          <p>{money(s.revenue)}</p>
          <p className="text-xs text-lilac">{plural(s.unitsSold || 0, 'unit')}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div className="space-y-0.5">
          <ScheduleBadge row={s} meta={SALE_META} />
          <Countdown startsAt={s.startsAt} endsAt={s.endsAt} isActive={s.isActive} className="block" />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing({ sale: s }) },
            { label: 'Performance', icon: BarChart3, onClick: () => setReportFor(s) },
            { label: 'Duplicate', icon: Copy, onClick: () => setEditing({ initial: { ...toForm(s), name: `${s.name} (copy)`, startsAt: '', endsAt: '', isActive: false } }) },
            { label: s.isActive === false ? 'Switch on' : 'Switch off', icon: Power, onClick: () => askToggle(s), disabled: toggle.isPending },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(s) },
          ]}
        />
      ),
    },
  ];

  const filtering = state.q || state.status !== 'all';

  return (
    <>
      <PageHeader
        title="Flash sales"
        description="Timed price drops on selected products, with a countdown on the storefront."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            New flash sale
          </Button>
        }
      />
      <Segmented
        className="mb-3"
        value={state.status}
        onChange={(status) => set({ status })}
        items={[
          { value: 'all', label: 'All', count: counts.all },
          ...['active', 'scheduled', 'expired', 'inactive'].map((s) => ({ value: s, label: SALE_META[s].label, count: counts[s] })),
        ]}
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search sales…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={slice}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(s) => setEditing({ sale: s })}
        empty={
          <EmptyState
            icon={Zap}
            title={filtering ? 'No sales match these filters' : 'No flash sales yet'}
            description={filtering ? undefined : 'Pick a few products, set a discount and a time window.'}
            action={filtering ? <Button onClick={() => set({ q: '', status: 'all' })}>Clear filters</Button> : <Button icon={Plus} onClick={() => setEditing({})}>New flash sale</Button>}
          />
        }
        footer={filtered.length > PAGE_SIZE && <Pagination pagination={pagination} onPage={(page) => set({ page })} />}
      />
      <SaleDrawer
        key={editing ? editing.sale?._id || `new-${editing.initial?.name || ''}` : 'none'}
        open={Boolean(editing)}
        sale={editing?.sale}
        initial={editing?.initial}
        others={all}
        onClose={() => setEditing(null)}
      />
      <PerformanceDrawer sale={reportFor} onClose={() => setReportFor(null)} />
    </>
  );
}

function SaleDrawer({ open, sale, initial, others, onClose }) {
  const isNew = !sale;
  const form = useForm(initial || toForm(sale));
  const v = form.values;
  const [picking, setPicking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bulk, setBulk] = useState('');

  // Product details: names/prices from the populated sale, topped up with a lookup for newly added ids.
  const ids = v.items.map((i) => i.productId);
  const lookup = useApiList('/products/admin/all', { ids: ids.slice(0, 100).join(','), limit: 100 }, { enabled: open && ids.length > 0, key: 'products' });
  const byId = useMemo(() => {
    const map = {};
    for (const i of sale?.items || []) if (i.productId && typeof i.productId === 'object') map[idOf(i.productId)] = i.productId;
    for (const p of lookup.rows) map[idOf(p)] = { ...map[idOf(p)], ...p };
    return map;
  }, [sale, lookup.rows]);

  const setItems = (items) => form.set('items', items);
  const patchItem = (idx, patch) => setItems(v.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => setItems(v.items.filter((_, i) => i !== idx));
  const onPick = (nextIds) => {
    const current = new Map(v.items.map((it) => [it.productId, it]));
    setItems(nextIds.map(String).map((id) => current.get(id) || { productId: id, mode: 'percent', value: bulk === '' ? '' : bulk }));
  };

  const rowErrors = v.items.map((it) => rowError(it, byId[it.productId]));

  // Storefront applies the first sale it finds for a product, so warn about clashes.
  const clashes = useMemo(() => {
    const start = fromLocalInput(v.startsAt);
    const end = fromLocalInput(v.endsAt);
    if (!start || !end || !v.isActive) return [];
    const mine = new Set(v.items.map((i) => i.productId));
    return others
      .filter((o) => String(o._id) !== String(sale?._id) && o.isActive !== false && overlaps({ startsAt: start, endsAt: end }, o))
      .map((o) => ({ sale: o, shared: (o.items || []).filter((i) => mine.has(idOf(i.productId))).length }))
      .filter((c) => c.shared > 0);
  }, [others, sale, v.startsAt, v.endsAt, v.isActive, v.items]);

  const save = useApiMutation(
    (values) => {
      const body = {
        name: values.name.trim(),
        startsAt: fromLocalInput(values.startsAt),
        endsAt: fromLocalInput(values.endsAt),
        isActive: values.isActive,
        items: values.items.map((it) => (it.mode === 'price' ? { productId: it.productId, salePrice: Number(it.value) } : { productId: it.productId, percent: Number(it.value) })),
      };
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${sale._id}`, body);
    },
    {
      invalidate: INVALIDATE,
      success: isNew ? 'Flash sale created.' : 'Flash sale saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );

  const submit = (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const e = { ...scheduleErrors(v, { required: true }) };
    if (!v.name.trim()) e.name = 'Name is required.';
    if (!v.items.length) e.items = 'Add at least one product.';
    if (Object.keys(e).length || rowErrors.some(Boolean)) return form.setErrors(e);
    save.mutate(v);
  };

  const applyBulk = () => {
    if (bulk === '' || Number(bulk) <= 0 || Number(bulk) >= 100) return;
    setItems(v.items.map((it) => ({ ...it, mode: 'percent', value: bulk })));
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? 'New flash sale' : `Edit ${sale.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="flash-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create flash sale' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="flash-form" onSubmit={submit} className="space-y-7" noValidate>
        <FormSection title="Sale">
          <Field label="Name" required error={form.errors.name} hint="Shown with the countdown on the storefront.">
            {({ id, invalid }) => <Input id={id} invalid={invalid} {...form.bind('name')} placeholder="e.g. Full moon sale" autoFocus={isNew} />}
          </Field>
          <ScheduleFields form={form} required />
          <Switch label="Active" description="When off, the sale never runs, even inside its window." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
          {clashes.length > 0 && (
            <Note icon={AlertTriangle} tone="warning">
              Overlaps with {clashes.map((c) => `“${c.sale.name}” (${plural(c.shared, 'shared product')})`).join(', ')}. When two sales cover the same product at the same time, only one price is
              used — avoid overlaps.
            </Note>
          )}
        </FormSection>

        <FormSection title="Products" description="Each product gets either a percentage off or a fixed sale price.">
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={Plus} onClick={() => setPicking(true)}>
              Add products
            </Button>
            {v.items.length > 1 && (
              <div className="flex items-center gap-2">
                <NumberInput aria-label="Percent off for all" min={1} max={99} suffix="%" value={bulk} onChange={setBulk} className="w-28" placeholder="—" />
                <Button variant="ghost" onClick={applyBulk} disabled={bulk === '' || Number(bulk) <= 0 || Number(bulk) >= 100}>
                  Apply to all
                </Button>
              </div>
            )}
          </div>
          {form.errors.items && <p className="text-xs text-rose-300">{form.errors.items}</p>}
          {v.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-lilac">No products yet.</div>
          ) : (
            <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
              {v.items.map((it, idx) => {
                const p = byId[it.productId];
                const base = p?.price;
                const sp = salePriceOf(it, base);
                const err = rowErrors[idx];
                return (
                  <li key={it.productId} className="space-y-2 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Thumb src={p?.images?.[0] ? mediaUrl(p.images[0]) : ''} size={36} color={p?.colorHex} />
                      <div className="min-w-0 flex-1 basis-40">
                        {p ? <p className="truncate text-sm text-ivory">{p.name}</p> : lookup.isLoading ? <Skeleton className="h-4 w-32" /> : <p className="text-sm text-rose-300">Product not found</p>}
                        <p className="text-xs text-lilac">
                          {base != null ? `Regular ${money(base)}` : '—'}
                          {p?.sku ? ` · ${p.sku}` : ''}
                          {p?.isActive === false ? ' · inactive' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select aria-label="Discount type" options={MODES} value={it.mode} onChange={(e) => patchItem(idx, { mode: e.target.value, value: '' })} className="w-28" />
                        <NumberInput
                          aria-label={it.mode === 'price' ? 'Sale price' : 'Percent off'}
                          invalid={submitted && Boolean(err)}
                          min={0}
                          max={it.mode === 'percent' ? 99 : undefined}
                          step="any"
                          prefix={it.mode === 'price' ? '₹' : undefined}
                          suffix={it.mode === 'percent' ? '%' : undefined}
                          value={it.value}
                          onChange={(x) => patchItem(idx, { value: x })}
                          className="w-28"
                        />
                        <IconButton icon={X} label="Remove product" onClick={() => removeItem(idx)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-12 text-xs">
                      {sp != null && base != null && sp < base && (
                        <span className="text-emerald-300">
                          Sells at {money(sp)} <span className="text-lilac">({Math.round((1 - sp / base) * 100)}% off)</span>
                        </span>
                      )}
                      {err && (submitted || (sp != null && base != null && sp >= base)) && <span className="text-rose-300">{err}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>
      </form>
      <ProductPickerModal open={picking} onClose={() => setPicking(false)} selected={ids} onChange={onPick} />
    </Drawer>
  );
}

function PerformanceDrawer({ sale, onClose }) {
  const { data, isLoading, error, refetch } = useApiQuery(sale ? `${BASE}/${sale._id}/performance` : null, undefined, { keepPrevious: false });
  const report = data?.report || {};
  const s = data?.sale || sale;
  const gross = (Number(report.revenue) || 0) + (Number(report.discountCost) || 0);
  const priceById = Object.fromEntries((sale?.items || []).map((i) => [idOf(i.productId), i.productId?.price]));
  return (
    <Drawer open={Boolean(sale)} onClose={onClose} title={sale ? `Performance · ${sale.name}` : 'Performance'} width="md">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <ScheduleBadge row={s} meta={SALE_META} />
            <Countdown startsAt={s?.startsAt} endsAt={s?.endsAt} isActive={s?.isActive} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Units sold" value={number(report.unitsSold)} icon={ShoppingBag} />
            <Stat label="Revenue" value={money(report.revenue)} icon={IndianRupee} tone="green" />
            <Stat label="Discount given" value={money(report.discountCost)} icon={Zap} tone="rose" />
            <Stat label="Average discount" value={gross ? `${Math.round(((Number(report.discountCost) || 0) / gross) * 100)}%` : '—'} icon={BarChart3} tone="violet" />
          </div>
          <DescriptionList
            items={[
              { label: 'Starts', value: dateTime(s?.startsAt) },
              { label: 'Ends', value: dateTime(s?.endsAt) },
            ]}
          />
          <Card padded={false}>
            <p className="border-b border-white/[0.08] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold/90">Products ({number(s?.items?.length || 0)})</p>
            {(s?.items || []).length === 0 ? (
              <EmptyState icon={Package} title="No products in this sale" />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {s.items.map((i) => {
                  const id = idOf(i.productId);
                  const base = priceById[id];
                  const sp = i.salePrice != null ? Number(i.salePrice) : base != null && i.percent != null ? Math.round(base * (1 - i.percent / 100)) : null;
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate text-ivory">{i.productId?.name || 'Deleted product'}</span>
                      <span className={cx('shrink-0 text-xs tabular-nums', sp != null && base != null && sp >= base ? 'text-rose-300' : 'text-lilac')}>
                        {i.salePrice != null ? money(i.salePrice) : `${number(i.percent)}% off`}
                        {sp != null && base != null && i.salePrice == null ? ` → ${money(sp)}` : ''}
                        {sp != null && base != null && sp >= base && <Badge tone="danger" className="ml-2">Not applied</Badge>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </Drawer>
  );
}
