// Coupons: codes customers type at checkout. Unpaginated endpoint → filtered, sorted and paged client-side.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Dices, History, IndianRupee, Pencil, Plus, Power, Ticket, Trash2, TrendingUp, Users } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, fromLocalInput, money, number, plural, toLocalInput } from '../lib/format';
import { toast } from '../../lib/adminToast';
import {
  Badge,
  Button,
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  FormSection,
  Input,
  Menu,
  MoneyInput,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  Stat,
  Switch,
  Toolbar,
  nextSort,
  sortRows,
  useConfirm,
  useForm,
} from '../ui';
import { ProductPicker } from '../ui/pickers';
import { CategoryMultiSelect, ScheduleBadge, ScheduleFields } from './marketing/components';
import { SCHEDULE_META, idOf, paginate, randomCode, scheduleErrors, scheduleStatus } from './marketing/schedule';

const BASE = '/admin/coupons';
const INVALIDATE = [BASE, '/admin/dashboard'];
const PAGE_SIZE = 25;

const EMPTY = {
  code: '',
  type: 'percent',
  value: 10,
  minOrder: 0,
  maxDiscount: '',
  applyTo: 'all',
  categoryIds: [],
  productIds: [],
  audience: 'all',
  usageLimit: '',
  perCustomerLimit: 1,
  startsAt: '',
  endsAt: '',
  isActive: true,
};

const TYPES = [
  { value: 'percent', label: 'Percent off' },
  { value: 'fixed', label: 'Fixed amount off' },
];
const APPLY = [
  { value: 'all', label: 'Entire order' },
  { value: 'category', label: 'Selected categories' },
  { value: 'products', label: 'Selected products' },
];
const AUDIENCE = [
  { value: 'all', label: 'Everyone' },
  { value: 'new', label: 'New customers (no previous orders)' },
  { value: 'existing', label: 'Returning customers' },
];

const statusOf = (c) => c.status || scheduleStatus(c);
const valueLabel = (c) => (c.type === 'percent' ? `${number(c.value)}% off` : `${money(c.value)} off`);

function toForm(c) {
  if (!c) return EMPTY;
  return {
    code: c.code || '',
    type: c.type || 'percent',
    value: c.value ?? '',
    minOrder: c.minOrder ?? 0,
    maxDiscount: c.maxDiscount ?? '',
    applyTo: c.applyTo || 'all',
    categoryIds: (c.categoryIds || []).map(idOf),
    productIds: (c.productIds || []).map(idOf),
    audience: c.audience || 'all',
    usageLimit: c.usageLimit ?? '',
    perCustomerLimit: c.perCustomerLimit ?? 1,
    startsAt: toLocalInput(c.startsAt),
    endsAt: toLocalInput(c.endsAt),
    isActive: c.isActive !== false,
  };
}

function parseSort(s) {
  if (!s) return null;
  return s.startsWith('-') ? { key: s.slice(1), dir: 'desc' } : { key: s, dir: 'asc' };
}

export default function Coupons() {
  const [state, set] = useUrlState({ q: '', status: 'all', sort: '', page: 1, new: '' });
  const [editing, setEditing] = useState(null); // null | { mode: 'new'|'edit', coupon?, initial? }
  const [usageFor, setUsageFor] = useState(null);
  const confirm = useConfirm();

  const list = useApiList(BASE, undefined, { key: 'coupons' });
  const all = list.rows;

  const counts = useMemo(() => {
    const out = { all: all.length, active: 0, scheduled: 0, expired: 0, inactive: 0 };
    for (const c of all) out[statusOf(c)] += 1;
    return out;
  }, [all]);

  const totals = useMemo(
    () =>
      all.reduce(
        (acc, c) => ({
          uses: acc.uses + (Number(c.usedCount) || 0),
          revenue: acc.revenue + (Number(c.revenueGenerated) || 0),
          cost: acc.cost + (Number(c.discountCost) || 0),
        }),
        { uses: 0, revenue: 0, cost: 0 }
      ),
    [all]
  );

  const sort = parseSort(state.sort);
  const filtered = useMemo(() => {
    const q = state.q.trim().toUpperCase();
    const rows = all.filter((c) => (state.status === 'all' || statusOf(c) === state.status) && (!q || String(c.code).toUpperCase().includes(q)));
    return sortRows(rows, parseSort(state.sort), { createdAt: (c) => new Date(c.createdAt).getTime() || 0 });
  }, [all, state.q, state.status, state.sort]);
  const { slice, pagination } = paginate(filtered, state.page, PAGE_SIZE);

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: INVALIDATE, success: 'Coupon deleted.' });
  const toggle = useApiMutation((c) => apiSend('put', `${BASE}/${c._id}`, { isActive: c.isActive === false }), {
    invalidate: INVALIDATE,
    success: (_d, c) => (c.isActive === false ? `${c.code} activated.` : `${c.code} deactivated.`),
  });

  const openNew = () => setEditing({ mode: 'new' });
  const drawer = editing || (state.new === '1' ? { mode: 'new' } : null);
  const closeDrawer = () => {
    setEditing(null);
    if (state.new) set({ new: '', page: state.page });
  };

  const duplicate = (c) =>
    setEditing({
      mode: 'new',
      initial: { ...toForm(c), code: `${c.code}-${randomCode(3)}`.slice(0, 40), isActive: false },
    });

  const askDelete = async (c) => {
    const used = Number(c.usedCount) || 0;
    if (
      await confirm({
        title: `Delete ${c.code}?`,
        message: used
          ? `It has been used ${plural(used, 'time')}. Past orders keep their discount, but the usage history will no longer be linked. Deactivating keeps the record instead.`
          : 'Customers will no longer be able to use this code.',
        confirmLabel: 'Delete coupon',
        tone: 'danger',
      })
    )
      remove.mutate(c._id);
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <span className="font-mono text-sm font-medium tracking-wider text-ivory">{c.code}</span>
          <p className="mt-0.5 text-xs text-lilac">
            {valueLabel(c)}
            {c.minOrder ? ` · min ${money(c.minOrder)}` : ''}
            {c.type === 'percent' && c.maxDiscount != null ? ` · up to ${money(c.maxDiscount)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'applyTo',
      header: 'Applies to',
      hideBelow: 'md',
      render: (c) => (
        <div className="text-xs text-lilac">
          <p className="text-ivory">
            {c.applyTo === 'category' ? plural(c.categoryIds?.length || 0, 'category', 'categories') : c.applyTo === 'products' ? plural(c.productIds?.length || 0, 'product') : 'Entire order'}
          </p>
          {c.audience && c.audience !== 'all' && <p>{c.audience === 'new' ? 'New customers' : 'Returning customers'}</p>}
        </div>
      ),
    },
    {
      key: 'usedCount',
      header: 'Used',
      sortable: true,
      render: (c) => <UsageCell coupon={c} />,
    },
    { key: 'revenueGenerated', header: 'Revenue', sortable: true, align: 'right', hideBelow: 'lg', render: (c) => money(c.revenueGenerated) },
    { key: 'discountCost', header: 'Discount cost', sortable: true, align: 'right', hideBelow: 'lg', render: (c) => money(c.discountCost) },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <div className="space-y-0.5">
          <ScheduleBadge status={statusOf(c)} />
          {statusOf(c) === 'scheduled' && <p className="text-[11px] text-lilac">from {dateTime(c.startsAt)}</p>}
          {statusOf(c) === 'active' && c.endsAt && <p className="text-[11px] text-lilac">until {dateTime(c.endsAt)}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <Menu
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => setEditing({ mode: 'edit', coupon: c }) },
              { label: 'Usage history', icon: History, onClick: () => setUsageFor(c) },
              { label: 'Duplicate', icon: Copy, onClick: () => duplicate(c) },
              {
                label: 'Copy code',
                icon: Ticket,
                onClick: () => navigator.clipboard?.writeText(c.code).then(() => toast('Code copied.')),
              },
              { label: c.isActive === false ? 'Activate' : 'Deactivate', icon: Power, onClick: () => toggle.mutate(c), disabled: toggle.isPending },
              'divider',
              { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(c) },
            ]}
          />
      ),
    },
  ];

  const filtering = state.q || state.status !== 'all';

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Codes customers enter at checkout. Limit them to categories, products, new or returning customers."
        actions={
          <Button variant="primary" icon={Plus} onClick={openNew}>
            New coupon
          </Button>
        }
      />

      {!list.error && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Active coupons" value={number(counts.active)} icon={Ticket} loading={list.isLoading} hint={counts.scheduled ? `${number(counts.scheduled)} scheduled` : undefined} />
          <Stat label="Times used" value={number(totals.uses)} icon={Users} tone="violet" loading={list.isLoading} />
          <Stat label="Revenue with coupons" value={money(totals.revenue)} icon={TrendingUp} tone="green" loading={list.isLoading} />
          <Stat label="Discount given" value={money(totals.cost)} icon={IndianRupee} tone="rose" loading={list.isLoading} />
        </div>
      )}

      <Segmented
        className="mb-3"
        value={state.status}
        onChange={(status) => set({ status })}
        items={[
          { value: 'all', label: 'All', count: counts.all },
          ...['active', 'scheduled', 'expired', 'inactive'].map((s) => ({ value: s, label: SCHEDULE_META[s].label, count: counts[s] })),
        ]}
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search codes…" />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={slice}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(c) => setEditing({ mode: 'edit', coupon: c })}
        sort={sort}
        onSort={(key) => {
          const next = nextSort(sort, key);
          set({ sort: next.dir === 'desc' ? `-${next.key}` : next.key });
        }}
        empty={
          <EmptyState
            icon={Ticket}
            title={filtering ? 'No coupons match these filters' : 'No coupons yet'}
            description={filtering ? undefined : 'Create a code like WELCOME10 to reward new customers.'}
            action={
              filtering ? (
                <Button onClick={() => set({ q: '', status: 'all' })}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={openNew}>
                  New coupon
                </Button>
              )
            }
          />
        }
        footer={filtered.length > PAGE_SIZE && <Pagination pagination={pagination} onPage={(page) => set({ page })} />}
      />

      <CouponDrawer
        key={drawer ? drawer.coupon?._id || `new-${drawer.initial?.code || ''}` : 'none'}
        open={Boolean(drawer)}
        coupon={drawer?.coupon}
        initial={drawer?.initial}
        existingCodes={all}
        onClose={closeDrawer}
      />
      <UsageDrawer coupon={usageFor} onClose={() => setUsageFor(null)} />
    </>
  );
}

function UsageCell({ coupon: c }) {
  const used = Number(c.usedCount) || 0;
  const limit = c.usageLimit != null ? Number(c.usageLimit) : null;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="min-w-[5.5rem] space-y-1">
      <div className="flex items-center gap-1.5 text-sm tabular-nums">
        {number(used)}
        <span className="text-xs text-lilac">{limit != null ? `/ ${number(limit)}` : '/ ∞'}</span>
        {limit != null && used >= limit && <Badge tone="warning">Used up</Badge>}
      </div>
      {limit != null && (
        <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
          <div className={used >= limit ? 'h-full bg-amber-300' : 'h-full bg-gold'} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function CouponDrawer({ open, coupon, initial, existingCodes, onClose }) {
  const isNew = !coupon;
  const form = useForm(initial || toForm(coupon));
  const v = form.values;

  const save = useApiMutation(
    (values) => {
      const body = toPayload(
        {
          ...values,
          code: values.code.trim().toUpperCase(),
          minOrder: values.minOrder === '' ? 0 : values.minOrder,
          maxDiscount: values.type === 'percent' ? values.maxDiscount : null,
          categoryIds: values.applyTo === 'category' ? values.categoryIds : [],
          productIds: values.applyTo === 'products' ? values.productIds : [],
          startsAt: fromLocalInput(values.startsAt),
          endsAt: fromLocalInput(values.endsAt),
        },
        {
          nullable: ['maxDiscount', 'usageLimit', 'startsAt', 'endsAt'],
          numbers: ['value', 'minOrder', 'maxDiscount', 'usageLimit', 'perCustomerLimit'],
        }
      );
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${coupon._id}`, body);
    },
    {
      invalidate: INVALIDATE,
      success: isNew ? 'Coupon created.' : 'Coupon saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => {
        if (info.status === 409) form.setErrors({ code: 'That code is already in use.' });
        else form.setServerErrors(info.fields);
      },
    }
  );

  const validate = () => {
    const e = {};
    const code = v.code.trim().toUpperCase();
    if (!code) e.code = 'Code is required.';
    else if (code.length > 40) e.code = 'Use 40 characters or fewer.';
    else if (/\s/.test(code)) e.code = 'Codes cannot contain spaces.';
    else if (existingCodes.some((c) => c.code === code && String(c._id) !== String(coupon?._id))) e.code = 'That code is already in use.';
    if (v.value === '' || Number(v.value) <= 0) e.value = 'Enter a value above 0.';
    else if (v.type === 'percent' && Number(v.value) > 100) e.value = 'A percentage cannot exceed 100.';
    if (v.minOrder !== '' && Number(v.minOrder) < 0) e.minOrder = 'Cannot be negative.';
    if (v.type === 'percent' && v.maxDiscount !== '' && Number(v.maxDiscount) <= 0) e.maxDiscount = 'Enter an amount above 0, or leave empty.';
    if (v.applyTo === 'category' && !v.categoryIds.length) e.categoryIds = 'Choose at least one category.';
    if (v.applyTo === 'products' && !v.productIds.length) e.productIds = 'Choose at least one product.';
    if (v.usageLimit !== '' && (Number(v.usageLimit) < 1 || !Number.isInteger(Number(v.usageLimit)))) e.usageLimit = 'Use a whole number of 1 or more, or leave empty.';
    if (v.perCustomerLimit === '' || Number(v.perCustomerLimit) < 1 || !Number.isInteger(Number(v.perCustomerLimit))) e.perCustomerLimit = 'Use a whole number of 1 or more.';
    Object.assign(e, scheduleErrors(v));
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return form.setErrors(e);
    save.mutate(v);
  };

  const used = Number(coupon?.usedCount) || 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      width="md"
      title={isNew ? 'New coupon' : `Edit ${coupon.code}`}
      description={!isNew && used ? `Used ${plural(used, 'time')} · ${money(coupon.revenueGenerated)} revenue` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="coupon-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create coupon' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="space-y-7" noValidate>
        <FormSection title="Discount">
          <Field label="Code" required error={form.errors.code} hint="Stored in capitals. Customers can type it in any case.">
            {({ id, invalid }) => (
              <div className="flex gap-2">
                <Input
                  id={id}
                  invalid={invalid}
                  value={v.code}
                  onChange={(e) => form.set('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="e.g. WELCOME10"
                  maxLength={40}
                  className="font-mono uppercase tracking-wider"
                  autoFocus={isNew}
                />
                <Button icon={Dices} onClick={() => form.set('code', randomCode(8))}>
                  Generate
                </Button>
              </div>
            )}
          </Field>
          <FormGrid>
            <Field label="Type">{({ id }) => <Select id={id} options={TYPES} {...form.bind('type')} />}</Field>
            <Field label={v.type === 'percent' ? 'Percent off' : 'Amount off'} required error={form.errors.value}>
              {({ id, invalid }) =>
                v.type === 'percent' ? (
                  <NumberInput id={id} invalid={invalid} min={0} max={100} step="any" suffix="%" value={v.value} onChange={(x) => form.set('value', x)} />
                ) : (
                  <MoneyInput id={id} invalid={invalid} value={v.value} onChange={(x) => form.set('value', x)} />
                )
              }
            </Field>
            <Field label="Minimum order" error={form.errors.minOrder} hint="Cart subtotal needed. 0 = no minimum.">
              {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} value={v.minOrder} onChange={(x) => form.set('minOrder', x)} />}
            </Field>
            {v.type === 'percent' && (
              <Field label="Maximum discount" error={form.errors.maxDiscount} hint="Optional cap. Empty = no cap.">
                {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} value={v.maxDiscount} onChange={(x) => form.set('maxDiscount', x)} placeholder="No cap" />}
              </Field>
            )}
          </FormGrid>
        </FormSection>

        <FormSection title="Eligibility">
          <FormGrid>
            <Field label="Applies to">{({ id }) => <Select id={id} options={APPLY} {...form.bind('applyTo')} />}</Field>
            <Field label="Customers">{({ id }) => <Select id={id} options={AUDIENCE} {...form.bind('audience')} />}</Field>
          </FormGrid>
          {v.applyTo === 'category' && (
            <Field label="Categories" required error={form.errors.categoryIds} hint="The discount applies only to items in these categories.">
              <CategoryMultiSelect value={v.categoryIds} onChange={(ids) => form.set('categoryIds', ids)} invalid={Boolean(form.errors.categoryIds)} />
            </Field>
          )}
          {v.applyTo === 'products' && (
            <Field label="Products" required error={form.errors.productIds} hint="The discount applies only to these products.">
              <ProductPicker value={v.productIds} onChange={(ids) => form.set('productIds', ids)} />
            </Field>
          )}
        </FormSection>

        <FormSection title="Limits">
          <FormGrid>
            <Field label="Total uses" error={form.errors.usageLimit} hint={used ? `Used ${number(used)} so far. Empty = unlimited.` : 'Empty = unlimited.'}>
              {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={1} value={v.usageLimit} onChange={(x) => form.set('usageLimit', x)} placeholder="Unlimited" />}
            </Field>
            <Field label="Uses per customer" required error={form.errors.perCustomerLimit}>
              {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={1} value={v.perCustomerLimit} onChange={(x) => form.set('perCustomerLimit', x)} />}
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Schedule">
          <ScheduleFields form={form} />
          <Switch label="Active" description="Inactive coupons are rejected at checkout, even inside the schedule." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
        </FormSection>
      </form>
    </Drawer>
  );
}

function UsageDrawer({ coupon, onClose }) {
  const { data, isLoading, error, refetch } = useApiQuery(coupon ? `${BASE}/${coupon._id}/usage` : null, undefined, { keepPrevious: false });
  const history = data?.history || [];
  const totalDiscount = history.reduce((s, h) => s + (Number(h.discount) || 0), 0);
  const totalOrders = history.reduce((s, h) => s + (Number(h.orderTotal ?? h.orderId?.total) || 0), 0);
  return (
    <Drawer open={Boolean(coupon)} onClose={onClose} title={coupon ? `Usage · ${coupon.code}` : 'Usage'} description="Latest 200 uses, newest first.">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="Not used yet" description="Orders that use this code will show up here." />
      ) : (
        <div className="space-y-5">
          <DescriptionList
            items={[
              { label: 'Uses shown', value: number(history.length) },
              { label: 'Discount given', value: money(totalDiscount) },
              { label: 'Order value', value: money(totalOrders) },
              { label: 'Usage limit', value: coupon.usageLimit != null ? number(coupon.usageLimit) : 'Unlimited' },
            ]}
          />
          <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {history.map((h) => (
              <li key={h._id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{h.userId?.name || h.userId?.email || 'Guest / deleted customer'}</p>
                  <p className="text-xs text-lilac">
                    {h.orderId?.orderNumber ? (
                      <Link to={`/admin/orders/${h.orderId._id || h.orderId}`} className="text-gold hover:underline" onClick={onClose}>
                        {h.orderId.orderNumber}
                      </Link>
                    ) : (
                      'Order removed'
                    )}
                    {' · '}
                    {dateTime(h.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm tabular-nums">
                  <p className="text-ivory">−{money(h.discount)}</p>
                  <p className="text-xs text-lilac">of {money(h.orderTotal ?? h.orderId?.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
