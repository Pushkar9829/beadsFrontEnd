import { useMemo, useState } from 'react';
import { ExternalLink, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiGet, apiSend, toPayload, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { money, plural } from '../lib/format';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  FormGrid,
  FormSection,
  Input,
  MediaInput,
  Menu,
  MoneyInput,
  NumberInput,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  Switch,
  Textarea,
  Thumb,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { ProductPicker } from '../ui/pickers';
import { COLLECTION_INVALIDATE, EMPTY_SEO, SeoFields, refId, slugify } from './catalog/shared';
import { useAllProducts } from './catalog/useAllProducts';

const BASE = '/admin/collections';
const RULES = [
  { value: 'manual', label: 'Hand-picked products' },
  { value: 'featured', label: 'Featured products' },
  { value: 'new_arrivals', label: 'New arrivals' },
  { value: 'bestsellers', label: 'Best sellers' },
  { value: 'trending', label: 'Trending' },
  { value: 'under_price', label: 'Under a price' },
];
const DEFAULT_DAYS = { new_arrivals: 30, bestsellers: 90, trending: 14 };
const ruleLabel = (r) => RULES.find((x) => x.value === (r || 'manual'))?.label || r;

function ruleSummary(c) {
  const rule = c.ruleType || 'manual';
  const cfg = c.ruleConfig || {};
  if (rule === 'under_price') return `At or below ${money(cfg.maxPrice || 999)}`;
  if (rule in DEFAULT_DAYS) return `Last ${cfg.days || DEFAULT_DAYS[rule]} days`;
  if (rule === 'featured') return 'Featured order';
  return 'Picked by hand';
}

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: 0,
  isActive: true,
  ruleType: 'manual',
  ruleConfig: { maxPrice: '', days: '', limit: 24 },
  seo: EMPTY_SEO,
};

export default function Collections() {
  const [state, set] = useUrlState({ q: '', rule: 'all', active: 'all' });
  const [editing, setEditing] = useState(null); // null | 'new' | collection
  const confirm = useConfirm();
  const query = useApiQuery(BASE);
  const all = useMemo(() => query.data?.collections || [], [query.data]);

  const rows = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    return all.filter((c) => {
      if (state.rule !== 'all' && (c.ruleType || 'manual') !== state.rule) return false;
      if (state.active !== 'all' && String(c.isActive !== false) !== state.active) return false;
      if (q && !`${c.name} ${c.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, state]);
  const searching = Boolean(state.q || state.rule !== 'all' || state.active !== 'all');

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), {
    invalidate: [...COLLECTION_INVALIDATE, '/products/admin'],
    success: 'Collection deleted.',
  });

  const columns = [
    {
      key: 'name',
      header: 'Collection',
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={c.image ? mediaUrl(c.image) : ''} size={40} />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="truncate text-xs text-lilac">/collection/{c.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rule',
      header: 'Products',
      render: (c) => (
        <div>
          <div>{ruleLabel(c.ruleType)}</div>
          <div className="text-xs text-lilac">
            {ruleSummary(c)} · up to {c.ruleConfig?.limit || 24}
          </div>
        </div>
      ),
    },
    { key: 'sortOrder', header: 'Order', hideBelow: 'md', align: 'right', render: (c) => c.sortOrder ?? 0 },
    { key: 'isActive', header: 'Status', render: (c) => (c.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(c) },
            { label: 'View on store', icon: ExternalLink, onClick: () => window.open(`/collection/${c.slug}`, '_blank', 'noopener') },
            'divider',
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: async () => {
                if (
                  await confirm({
                    title: `Delete “${c.name}”?`,
                    message: 'Products are not deleted; they just leave this collection. Links to the collection page will stop working.',
                    confirmLabel: 'Delete collection',
                    tone: 'danger',
                  })
                )
                  remove.mutate(c._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Collections"
        description="Curated groups of products, picked by hand or filled by a rule."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            New collection
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search collections…" />
        <FilterSelect label="Type" value={state.rule} onChange={(rule) => set({ rule })} options={[{ value: 'all', label: 'All types' }, ...RULES]} />
        <FilterSelect
          label="Status"
          value={state.active}
          onChange={(active) => set({ active })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Hidden' },
          ]}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={Layers}
            title={searching ? 'No collections match' : 'No collections yet'}
            action={
              !searching && (
                <Button icon={Plus} onClick={() => setEditing('new')}>
                  New collection
                </Button>
              )
            }
          />
        }
      />
      <CollectionDrawer key={editing?._id || editing || 'none'} collection={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function CollectionDrawer({ collection, onClose }) {
  const isNew = collection === 'new';
  const initial = useMemo(() => {
    if (!collection || isNew) return EMPTY;
    const cfg = collection.ruleConfig || {};
    return {
      name: collection.name || '',
      slug: collection.slug || '',
      description: collection.description || '',
      image: collection.image || '',
      sortOrder: collection.sortOrder ?? 0,
      isActive: collection.isActive !== false,
      ruleType: collection.ruleType || 'manual',
      ruleConfig: { maxPrice: cfg.maxPrice ?? '', days: cfg.days ?? '', limit: cfg.limit ?? 24 },
      seo: { ...EMPTY_SEO, ...(collection.seo || {}) },
    };
  }, [collection, isNew]);
  const form = useForm(initial);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [picked, setPicked] = useState(null); // null = membership untouched
  const [progress, setProgress] = useState(null);
  const v = form.values;
  const manual = v.ruleType === 'manual';

  const products = useAllProducts({ enabled: Boolean(collection) && manual });
  const byId = useMemo(() => new Map((products.data || []).map((p) => [String(p._id), p])), [products.data]);
  const members = useMemo(() => {
    if (isNew || !collection) return [];
    const id = String(collection._id);
    return (products.data || []).filter((p) => (p.collectionIds || []).some((c) => refId(c) === id)).map((p) => String(p._id));
  }, [products.data, collection, isNew]);
  const selected = picked ?? members;
  const limit = Number(v.ruleConfig.limit) || 24;

  const save = useApiMutation(
    async (values) => {
      const num = (x) => (x === '' || x === null || x === undefined ? null : Number(x));
      const body = toPayload(
        {
          ...values,
          slug: slugify(values.slug),
          ruleConfig: { maxPrice: num(values.ruleConfig.maxPrice), days: num(values.ruleConfig.days), limit: num(values.ruleConfig.limit) ?? 24 },
        },
        { numbers: ['sortOrder'] }
      );
      if (isNew && !body.slug) delete body.slug;
      const res = isNew ? await apiSend('post', BASE, body) : await apiSend('put', `${BASE}/${collection._id}`, body);
      const colId = String(res?.collection?._id || collection?._id || '');

      // Manual membership lives on each product: add/remove this collection id product by product.
      if (values.ruleType === 'manual' && picked && colId) {
        const before = new Set(members);
        const after = new Set(picked);
        const changes = [...[...after].filter((id) => !before.has(id)).map((id) => [id, true]), ...[...before].filter((id) => !after.has(id)).map((id) => [id, false])];
        const failed = [];
        setProgress({ done: 0, total: changes.length });
        for (let i = 0; i < changes.length; i += 1) {
          const [pid, add] = changes[i];
          try {
            let product = byId.get(pid);
            if (!product) product = (await apiGet(`/products/admin/${pid}`))?.product;
            const current = (product?.collectionIds || []).map(refId).filter(Boolean);
            const next = add ? [...new Set([...current, colId])] : current.filter((x) => x !== colId);
            await apiSend('put', `/products/admin/${pid}`, { collectionIds: next });
          } catch {
            failed.push(pid);
          }
          setProgress({ done: i + 1, total: changes.length });
        }
        setProgress(null);
        return { ...res, failed: failed.length };
      }
      return res;
    },
    {
      invalidate: [...COLLECTION_INVALIDATE, '/products/admin'],
      success: (data) => (data?.failed ? `Collection saved, but ${plural(data.failed, 'product')} could not be updated.` : isNew ? 'Collection created.' : 'Collection saved.'),
      onSuccess: () => {
        form.reset();
        setPicked(null);
        onClose();
      },
      onError: (info) => {
        setProgress(null);
        const errs = { ...(info.fields || {}) };
        if (info.status === 409 && /slug/i.test(info.message)) errs.slug = info.message;
        form.setServerErrors(errs);
      },
    }
  );

  const dirty = form.dirty || picked !== null;
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!v.name.trim()) errs.name = 'Name is required.';
    if (!isNew && !slugify(v.slug)) errs.slug = 'Slug is required.';
    if (v.ruleType === 'under_price' && !(Number(v.ruleConfig.maxPrice) > 0)) errs.maxPrice = 'Enter a price.';
    if (Object.keys(errs).length) return form.setErrors(errs);
    save.mutate(v);
  };

  return (
    <Drawer
      open={Boolean(collection)}
      onClose={onClose}
      dirty={dirty}
      width="lg"
      title={isNew ? 'New collection' : `Edit ${collection?.name || 'collection'}`}
      footer={
        <>
          {progress && (
            <span className="mr-auto text-xs tabular-nums text-lilac">
              Updating products {progress.done}/{progress.total}…
            </span>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="collection-form" loading={save.isPending} disabled={(!dirty && !isNew) || (manual && picked !== null && products.isLoading)}>
            {isNew ? 'Create collection' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="collection-form" onSubmit={submit} className="space-y-6">
        <FormSection>
          <Field label="Name" required error={form.errors.name}>
            {({ id }) => (
              <Input
                id={id}
                autoFocus
                value={v.name}
                invalid={Boolean(form.errors.name)}
                onChange={(e) => form.set(slugEdited ? { name: e.target.value } : { name: e.target.value, slug: slugify(e.target.value) })}
              />
            )}
          </Field>
          <Field label="URL slug" error={form.errors.slug}>
            {({ id }) => (
              <Input
                id={id}
                prefix="/collection/"
                value={v.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  form.set('slug', e.target.value);
                }}
                onBlur={() => form.set('slug', slugify(v.slug))}
              />
            )}
          </Field>
          <Field label="Description">{({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} />}</Field>
          <FormGrid>
            <Field label="Image">
              <MediaInput value={v.image} onChange={(image) => form.set('image', image || '')} folder="collection" />
            </Field>
            <div className="space-y-4">
              <Field label="Sort order" hint="Lower numbers show first.">
                {({ id }) => <NumberInput id={id} value={v.sortOrder} onChange={(x) => form.set('sortOrder', x)} />}
              </Field>
              <Switch label="Active" description="Hidden collections are not shown on the store." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Products">
          <FormGrid>
            <Field label="How products are chosen">{({ id }) => <Select id={id} options={RULES} {...form.bind('ruleType')} />}</Field>
            <Field label="Show up to" hint="1–100 products.">
              {({ id }) => <NumberInput id={id} min={1} max={100} value={v.ruleConfig.limit} onChange={(x) => form.set('ruleConfig.limit', x)} />}
            </Field>
          </FormGrid>
          {v.ruleType === 'under_price' && (
            <Field label="Maximum price" required error={form.errors.maxPrice}>
              {({ id }) => <MoneyInput id={id} value={v.ruleConfig.maxPrice} onChange={(x) => form.set('ruleConfig.maxPrice', x)} placeholder="999" />}
            </Field>
          )}
          {v.ruleType in DEFAULT_DAYS && (
            <Field label="Look back (days)" hint={`Default ${DEFAULT_DAYS[v.ruleType]} days.`}>
              {({ id }) => <NumberInput id={id} min={1} value={v.ruleConfig.days} onChange={(x) => form.set('ruleConfig.days', x)} placeholder={String(DEFAULT_DAYS[v.ruleType])} />}
            </Field>
          )}
          {v.ruleType === 'featured' && <p className="text-xs text-lilac">Uses the products marked as featured, in the order set on the Featured page.</p>}
          {(v.ruleType === 'bestsellers' || v.ruleType === 'trending') && <p className="text-xs text-lilac">Ranked by paid order quantity. Falls back to the newest products when there are no sales.</p>}
          {manual &&
            (products.isLoading ? (
              <Skeleton className="h-20" />
            ) : products.error ? (
              <p className="text-xs text-rose-300">Could not load products. Close and try again.</p>
            ) : (
              <>
                <ProductPicker value={selected} onChange={(ids) => setPicked(ids.map(String))} />
                {selected.length > limit && (
                  <p className="text-xs text-amber-300">
                    Only the newest {limit} of these {selected.length} products are shown on the store. Raise “Show up to” to show more.
                  </p>
                )}
                <p className="text-xs text-lilac">You can also add a product to collections from its edit page.</p>
              </>
            ))}
        </FormSection>

        <SeoFields form={form} folder="collection" />
      </form>
    </Drawer>
  );
}
