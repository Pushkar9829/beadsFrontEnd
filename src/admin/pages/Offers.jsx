// Automatic offers: applied at checkout without a code. Unpaginated endpoint → filtered client-side.
import { useMemo, useState } from 'react';
import { Copy, Gift, Info, Pencil, Percent, Plus, Power, Trash2, Truck } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { toast } from '../../lib/adminToast';
import { dateTime, fromLocalInput, money, number, plural, toLocalInput } from '../lib/format';
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
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
  Switch,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { CategorySelect, ProductPicker } from '../ui/pickers';
import { Note, ScheduleBadge, ScheduleFields } from './marketing/components';
import { SCHEDULE_META, idOf, paginate, scheduleErrors, scheduleStatus } from './marketing/schedule';

const BASE = '/admin/offers';
const INVALIDATE = [BASE];
const PAGE_SIZE = 25;

const TYPES = [
  { value: 'percent', label: 'Percent off', help: 'A percentage off the eligible items.' },
  { value: 'fixed', label: 'Amount off', help: 'A fixed rupee amount off the eligible items (never more than their total).' },
  { value: 'bogo', label: 'Buy X get Y', help: 'For every X + Y eligible units in the cart, the cheapest Y are free.' },
  { value: 'bundle', label: 'Bundle discount', help: 'A percent or amount off when the eligible items are bought together. Percent wins if both are set.' },
  { value: 'free_shipping', label: 'Free shipping', help: 'Shipping is free. Use a minimum order to set the threshold.' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

const SCOPES = [
  { value: 'all', label: 'All products' },
  { value: 'category', label: 'A category' },
  { value: 'products', label: 'Specific products' },
];

const EMPTY = {
  name: '',
  type: 'percent',
  percent: 10,
  amountOff: '',
  buyQty: 1,
  getQty: 1,
  minOrder: '',
  scope: 'all',
  categoryId: '',
  productIds: [],
  startsAt: '',
  endsAt: '',
  isActive: true,
};

function toForm(o) {
  if (!o) return EMPTY;
  const productIds = (o.productIds || []).map(idOf);
  const categoryId = o.categoryId ? idOf(o.categoryId) : '';
  return {
    name: o.name || '',
    type: o.type || 'percent',
    percent: o.percent ?? '',
    amountOff: o.amountOff ?? '',
    buyQty: o.buyQty ?? 1,
    getQty: o.getQty ?? 1,
    minOrder: o.minOrder ?? '',
    // Backend: product list wins over category, so the UI treats them as one choice.
    scope: productIds.length ? 'products' : categoryId ? 'category' : 'all',
    categoryId,
    productIds,
    startsAt: toLocalInput(o.startsAt),
    endsAt: toLocalInput(o.endsAt),
    isActive: o.isActive !== false,
  };
}

function detail(o) {
  switch (o.type) {
    case 'percent':
      return `${number(o.percent)}% off`;
    case 'fixed':
      return `${money(o.amountOff)} off`;
    case 'bogo':
      return `Buy ${o.buyQty || 1} get ${o.getQty || 1} free`;
    case 'bundle':
      return o.percent ? `${number(o.percent)}% off bundle` : `${money(o.amountOff)} off bundle`;
    case 'free_shipping':
      return 'Free shipping';
    default:
      return '—';
  }
}

function scopeLabel(o) {
  if (o.productIds?.length) return plural(o.productIds.length, 'product');
  if (o.categoryId) return o.categoryId.name || 'One category';
  return 'All products';
}

export default function Offers() {
  const [state, set] = useUrlState({ q: '', status: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | { offer?, initial? }
  const confirm = useConfirm();

  const list = useApiList(BASE, undefined, { key: 'offers' });
  const all = list.rows;

  const counts = useMemo(() => {
    const out = { all: all.length, active: 0, scheduled: 0, expired: 0, inactive: 0 };
    for (const o of all) out[scheduleStatus(o)] += 1;
    return out;
  }, [all]);

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    return all.filter((o) => (state.status === 'all' || scheduleStatus(o) === state.status) && (!q || o.name?.toLowerCase().includes(q)));
  }, [all, state.q, state.status]);
  const { slice, pagination } = paginate(filtered, state.page, PAGE_SIZE);

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: INVALIDATE, success: 'Offer deleted.' });
  const toggle = useApiMutation((o) => apiSend('put', `${BASE}/${o._id}`, { isActive: o.isActive === false }), {
    invalidate: INVALIDATE,
    success: (_d, o) => (o.isActive === false ? 'Offer activated.' : 'Offer paused.'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Offer',
      render: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold">{o.type === 'free_shipping' ? <Truck size={15} /> : o.type === 'bogo' ? <Gift size={15} /> : <Percent size={15} />}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{o.name}</p>
            <p className="text-xs text-lilac">{TYPE_LABEL[o.type] || o.type}</p>
          </div>
        </div>
      ),
    },
    { key: 'detail', header: 'Discount', render: (o) => detail(o) },
    {
      key: 'scope',
      header: 'Eligible',
      hideBelow: 'md',
      render: (o) => (
        <div className="text-xs">
          <p className="text-ivory">{scopeLabel(o)}</p>
          {o.minOrder ? <p className="text-lilac">Min order {money(o.minOrder)}</p> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => {
        const s = scheduleStatus(o);
        return (
          <div className="space-y-0.5">
            <ScheduleBadge status={s} />
            {s === 'scheduled' && <p className="text-[11px] text-lilac">from {dateTime(o.startsAt)}</p>}
            {s === 'active' && o.endsAt && <p className="text-[11px] text-lilac">until {dateTime(o.endsAt)}</p>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing({ offer: o }) },
            { label: 'Duplicate', icon: Copy, onClick: () => setEditing({ initial: { ...toForm(o), name: `${o.name} (copy)`, isActive: false } }) },
            { label: o.isActive === false ? 'Activate' : 'Pause', icon: Power, onClick: () => toggle.mutate(o), disabled: toggle.isPending },
            'divider',
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: async () => {
                if (await confirm({ title: `Delete “${o.name}”?`, message: 'Checkout stops applying it straight away. Past orders keep their discount.', confirmLabel: 'Delete offer', tone: 'danger' }))
                  remove.mutate(o._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  const filtering = state.q || state.status !== 'all';

  return (
    <>
      <PageHeader
        title="Offers"
        description="Automatic promotions applied at checkout — no code needed."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            New offer
          </Button>
        }
      />
      <Note icon={Info}>
        At checkout the active offer with the <span className="text-ivory">biggest discount</span> is applied (only one). A free-shipping offer can apply on top of it. Coupons are
        handled separately.
      </Note>
      <div className="mt-4" />
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
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search offers…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={slice}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(o) => setEditing({ offer: o })}
        empty={
          <EmptyState
            icon={Gift}
            title={filtering ? 'No offers match these filters' : 'No offers yet'}
            description={filtering ? undefined : 'Try “Free shipping over ₹999” or “Buy 2 get 1 free”.'}
            action={filtering ? <Button onClick={() => set({ q: '', status: 'all' })}>Clear filters</Button> : <Button icon={Plus} onClick={() => setEditing({})}>New offer</Button>}
          />
        }
        footer={filtered.length > PAGE_SIZE && <Pagination pagination={pagination} onPage={(page) => set({ page })} />}
      />
      <OfferDrawer
        key={editing ? editing.offer?._id || `new-${editing.initial?.name || ''}` : 'none'}
        open={Boolean(editing)}
        offer={editing?.offer}
        initial={editing?.initial}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function OfferDrawer({ open, offer, initial, onClose }) {
  const isNew = !offer;
  const form = useForm(initial || toForm(offer));
  const v = form.values;
  const type = TYPES.find((t) => t.value === v.type);

  const save = useApiMutation(
    (values) => {
      const t = values.type;
      const scope = t === 'free_shipping' ? 'all' : values.scope; // shipping offers ignore eligibility
      const body = toPayload(
        {
          name: values.name.trim(),
          type: t,
          // Fields that don't belong to the chosen type are cleared, so a stale value can't change the maths
          // (e.g. an old percent would override amountOff on a bundle).
          percent: t === 'percent' || t === 'bundle' ? values.percent : null,
          amountOff: t === 'fixed' || t === 'bundle' ? values.amountOff : null,
          buyQty: t === 'bogo' ? values.buyQty : null,
          getQty: t === 'bogo' ? values.getQty : null,
          minOrder: values.minOrder,
          categoryId: scope === 'category' ? values.categoryId : null,
          productIds: scope === 'products' ? values.productIds : [],
          startsAt: fromLocalInput(values.startsAt),
          endsAt: fromLocalInput(values.endsAt),
          isActive: values.isActive,
        },
        {
          nullable: ['percent', 'amountOff', 'buyQty', 'getQty', 'minOrder', 'categoryId', 'startsAt', 'endsAt'],
          numbers: ['percent', 'amountOff', 'buyQty', 'getQty', 'minOrder'],
        }
      );
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${offer._id}`, body);
    },
    {
      invalidate: INVALIDATE,
      success: isNew ? 'Offer created.' : 'Offer saved.',
      onSuccess: (data, values) => {
        // Offer schedules are a v2 addition; an older API silently drops unknown fields.
        const saved = data?.offer;
        if (saved && (values.startsAt || values.endsAt) && saved.startsAt === undefined && saved.endsAt === undefined) {
          toast('Saved, but the server ignored the schedule. It will apply once the API supports offer dates.', 'error');
        }
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );

  const validate = () => {
    const e = {};
    const pct = (x) => x !== '' && Number(x) > 0 && Number(x) <= 100;
    const pos = (x) => x !== '' && Number(x) > 0;
    const whole = (x) => x !== '' && Number.isInteger(Number(x)) && Number(x) >= 1;
    if (!v.name.trim()) e.name = 'Name is required.';
    if (v.type === 'percent' && !pct(v.percent)) e.percent = 'Enter a percentage between 0 and 100.';
    if (v.type === 'fixed' && !pos(v.amountOff)) e.amountOff = 'Enter an amount above 0.';
    if (v.type === 'bogo') {
      if (!whole(v.buyQty)) e.buyQty = 'Use a whole number of 1 or more.';
      if (!whole(v.getQty)) e.getQty = 'Use a whole number of 1 or more.';
    }
    if (v.type === 'bundle') {
      if (v.percent === '' && v.amountOff === '') e.percent = 'Set a percent or an amount.';
      else {
        if (v.percent !== '' && !pct(v.percent)) e.percent = 'Enter a percentage between 0 and 100.';
        if (v.amountOff !== '' && !pos(v.amountOff)) e.amountOff = 'Enter an amount above 0.';
      }
    }
    if (v.minOrder !== '' && Number(v.minOrder) < 0) e.minOrder = 'Cannot be negative.';
    const scoped = v.type !== 'free_shipping';
    if (scoped && v.scope === 'category' && !v.categoryId) e.categoryId = 'Choose a category.';
    if (scoped && v.scope === 'products' && !v.productIds.length) e.productIds = 'Choose at least one product.';
    Object.assign(e, scheduleErrors(v));
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return form.setErrors(e);
    save.mutate(v);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New offer' : `Edit ${offer.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="offer-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create offer' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} className="space-y-7" noValidate>
        <FormSection title="Offer">
          <Field label="Name" required error={form.errors.name} hint="Shown to customers at checkout.">
            {({ id, invalid }) => <Input id={id} invalid={invalid} {...form.bind('name')} placeholder="e.g. Free shipping over ₹999" autoFocus={isNew} />}
          </Field>
          <Field label="Type" hint={type?.help}>
            {({ id }) => <Select id={id} options={TYPES} {...form.bind('type')} />}
          </Field>
          {v.type === 'percent' && (
            <FormGrid>
              <Field label="Percent off" required error={form.errors.percent}>
                {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={0} max={100} step="any" suffix="%" value={v.percent} onChange={(x) => form.set('percent', x)} />}
              </Field>
            </FormGrid>
          )}
          {v.type === 'fixed' && (
            <FormGrid>
              <Field label="Amount off" required error={form.errors.amountOff}>
                {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} value={v.amountOff} onChange={(x) => form.set('amountOff', x)} />}
              </Field>
            </FormGrid>
          )}
          {v.type === 'bogo' && (
            <FormGrid>
              <Field label="Customer buys" required error={form.errors.buyQty}>
                {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={1} suffix="units" value={v.buyQty} onChange={(x) => form.set('buyQty', x)} />}
              </Field>
              <Field label="Gets free" required error={form.errors.getQty}>
                {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={1} suffix="units" value={v.getQty} onChange={(x) => form.set('getQty', x)} />}
              </Field>
            </FormGrid>
          )}
          {v.type === 'bundle' && (
            <FormGrid>
              <Field label="Percent off" error={form.errors.percent} hint="Used when set.">
                {({ id, invalid }) => <NumberInput id={id} invalid={invalid} min={0} max={100} step="any" suffix="%" value={v.percent} onChange={(x) => form.set('percent', x)} placeholder="—" />}
              </Field>
              <Field label="…or amount off" error={form.errors.amountOff} hint="Used when percent is empty.">
                {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} value={v.amountOff} onChange={(x) => form.set('amountOff', x)} placeholder="—" />}
              </Field>
            </FormGrid>
          )}
          <FormGrid>
            <Field
              label={v.type === 'free_shipping' ? 'Free shipping from' : 'Minimum order'}
              error={form.errors.minOrder}
              hint={v.type === 'free_shipping' ? 'Cart subtotal needed. Empty = always free.' : 'Cart subtotal needed. Empty = no minimum.'}
            >
              {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} value={v.minOrder} onChange={(x) => form.set('minOrder', x)} placeholder="No minimum" />}
            </Field>
          </FormGrid>
        </FormSection>

        {v.type !== 'free_shipping' && (
          <FormSection title="Eligible items" description="Which cart items count towards the offer and get discounted.">
            <Segmented items={SCOPES} value={v.scope} onChange={(scope) => form.set('scope', scope)} className="w-fit" />
            {v.scope === 'category' && (
              <Field label="Category" required error={form.errors.categoryId}>
                <CategorySelect value={v.categoryId} onChange={(id) => form.set('categoryId', id || '')} placeholder="Choose a category" />
              </Field>
            )}
            {v.scope === 'products' && (
              <Field label="Products" required error={form.errors.productIds}>
                <ProductPicker value={v.productIds} onChange={(ids) => form.set('productIds', ids)} />
              </Field>
            )}
            {v.scope !== 'all' && <p className="text-xs text-lilac/80">Custom bracelets only qualify when the offer covers all products.</p>}
          </FormSection>
        )}

        <FormSection title="Schedule">
          <ScheduleFields form={form} />
          <Switch label="Active" description="Paused offers are never applied, even inside the schedule." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
        </FormSection>
      </form>
    </Drawer>
  );
}
