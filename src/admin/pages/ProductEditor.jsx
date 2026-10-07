import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, PackageSearch, Plus, Save, Trash2, X } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiQuery, useApiMutation } from '../lib/query';
import { relative } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  FormSection,
  GalleryInput,
  IconButton,
  Input,
  MoneyInput,
  NumberInput,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  Textarea,
  useConfirm,
  useForm,
  useUnsavedWarning,
} from '../ui';
import { CategorySelect } from '../ui/pickers';
import { EMPTY_SEO, FAMILIES, PRODUCT_INVALIDATE, SeoFields, StockCell, refId, slugify } from './catalog/shared';

const EMPTY = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  images: [],
  price: '',
  compareAtPrice: '',
  sku: '',
  attributes: [],
  seo: EMPTY_SEO,
  isActive: true,
  featured: false,
  family: 'crystals',
  categoryId: '',
  collectionIds: [],
  stock: 0,
  lowStockLimit: 5,
  colorHex: '#6B3FA0',
  rating: 5,
  reviewCount: '',
};

/** API product → form values (ids instead of populated refs, attributes as editable rows). */
function fromProduct(p) {
  if (!p) return EMPTY;
  const attrs = p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes) ? p.attributes : {};
  return {
    name: p.name || '',
    slug: p.slug || '',
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
    price: p.price ?? '',
    compareAtPrice: p.compareAtPrice ?? '',
    sku: p.sku || '',
    attributes: Object.entries(attrs).map(([key, value]) => ({ key, value: value == null ? '' : String(value) })),
    seo: { ...EMPTY_SEO, ...(p.seo || {}) },
    isActive: p.isActive !== false,
    featured: Boolean(p.featured),
    family: p.family || 'crystals',
    categoryId: refId(p.categoryId),
    collectionIds: (p.collectionIds || []).map(refId).filter(Boolean),
    stock: p.stock ?? 0,
    lowStockLimit: p.lowStockLimit ?? 5,
    colorHex: p.colorHex || '#6B3FA0',
    rating: p.rating ?? 5,
    reviewCount: p.reviewCount ?? '',
  };
}

function buildPayload(values, isNew) {
  const attributes = {};
  for (const row of values.attributes || []) {
    const key = String(row.key || '').trim();
    const value = String(row.value || '').trim();
    if (key && value) attributes[key] = value;
  }
  const body = toPayload(
    { ...values, attributes, name: values.name.trim(), slug: slugify(values.slug), sku: String(values.sku || '').trim() },
    {
      nullable: ['compareAtPrice', 'sku', 'categoryId', 'reviewCount'],
      numbers: ['price', 'compareAtPrice', 'stock', 'lowStockLimit', 'rating', 'reviewCount'],
      // Stock of an existing product only changes through Inventory adjustments (keeps the history
      // and never overwrites sales that happened while this page was open).
      omit: isNew ? [] : ['stock'],
    }
  );
  if (isNew && !body.slug) delete body.slug; // server derives it from the name
  // Required-with-default numbers: an empty box means "keep the default", never null.
  for (const k of ['rating', 'lowStockLimit', 'stock']) if (body[k] === '' || body[k] === undefined) delete body[k];
  return body;
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const detail = useApiQuery(isNew ? null : `/products/admin/${id}`, undefined, { keepPrevious: false });
  const product = detail.data?.product;

  if (!isNew && detail.isLoading) return <EditorSkeleton />;
  if (!isNew && detail.error) {
    const notFound = detail.error?.status === 404 || detail.error?.response?.status === 404;
    return (
      <>
        <PageHeader title={notFound ? 'Product not found' : 'Product'} back={{ to: '/admin/products', label: 'Products' }} />
        {notFound ? (
          <EmptyState icon={PackageSearch} title="This product does not exist" description="It may have been deleted." action={<Button onClick={() => window.history.back()}>Go back</Button>} />
        ) : (
          <ErrorState error={detail.error} onRetry={detail.refetch} />
        )}
      </>
    );
  }
  return <EditorForm key={id || 'new'} isNew={isNew} product={product} />;
}

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[480px]" />
        <Skeleton className="h-[360px]" />
      </div>
    </div>
  );
}

function EditorForm({ isNew, product }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const initial = useMemo(() => fromProduct(product), [product]);
  const form = useForm(initial);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  useUnsavedWarning(form.dirty);
  const v = form.values;

  const collections = useApiQuery('/admin/collections');
  const attributeDefs = useApiList('/admin/attributes', { limit: 100, sort: 'sortOrder', isActive: 'true' }, { key: 'items' });
  const defs = attributeDefs.rows.filter((a) => a.appliesTo !== 'bead');

  const save = useApiMutation((body) => (isNew ? apiSend('post', '/products/admin', body) : apiSend('put', `/products/admin/${product._id}`, body)), {
    invalidate: PRODUCT_INVALIDATE,
    success: isNew ? 'Product created.' : 'Product saved.',
    onSuccess: (data) => {
      const saved = data?.product;
      if (isNew) {
        form.reset(fromProduct(saved));
        if (saved?._id) navigate(`/admin/products/${saved._id}`, { replace: true });
      } else if (saved) {
        form.reset(fromProduct({ ...product, ...saved }));
      }
    },
    onError: (info) => {
      const errs = { ...(info.fields || {}) };
      if (info.status === 409 && /slug/i.test(info.message)) errs.slug = info.message;
      if (info.status === 409 && /sku/i.test(info.message)) errs.sku = info.message;
      form.setServerErrors(errs);
    },
  });

  const remove = useApiMutation(
    async () => {
      const res = await apiSend('delete', `/products/admin/${product._id}`);
      form.reset();
      navigate('/admin/products', { replace: true });
      return res;
    },
    { invalidate: PRODUCT_INVALIDATE, success: 'Product deleted.' }
  );

  const onName = (e) => {
    const name = e.target.value;
    form.set(slugEdited ? { name } : { name, slug: slugify(name) });
  };

  const submit = (e) => {
    e?.preventDefault();
    const errs = {};
    if (!v.name.trim()) errs.name = 'Name is required.';
    if (v.price === '' || Number(v.price) < 0) errs.price = 'Enter a price of 0 or more.';
    if (!isNew && !slugify(v.slug)) errs.slug = 'Slug is required.';
    if (v.compareAtPrice !== '' && v.compareAtPrice !== null && Number(v.compareAtPrice) <= Number(v.price)) errs.compareAtPrice = 'Compare-at price should be higher than the price (or empty).';
    if (v.rating !== '' && (Number(v.rating) < 0 || Number(v.rating) > 5)) errs.rating = 'Between 0 and 5.';
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      return;
    }
    save.mutate(buildPayload(v, isNew));
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete “${product.name}”?`,
      message: 'This permanently removes the product. Past orders keep their copy, but carts, wishlists and collections lose it. To hide it instead, switch it to inactive.',
      confirmLabel: 'Delete product',
      tone: 'danger',
    });
    if (ok) remove.mutate();
  };

  const busy = save.isPending || remove.isPending;

  return (
    <form onSubmit={submit}>
      <PageHeader
        title={isNew ? 'New product' : product?.name || 'Product'}
        back={{ to: '/admin/products', label: 'Products' }}
        meta={
          !isNew && (
            <>
              {product?.isActive === false ? <Badge>Inactive</Badge> : <Badge tone="success">Active</Badge>}
              {product?.featured && <Badge tone="gold">Featured</Badge>}
            </>
          )
        }
        description={!isNew && product?.updatedAt ? `Last updated ${relative(product.updatedAt)}` : undefined}
        actions={
          !isNew && (
            <>
              {product?.slug && (
                <a href={`/p/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3.5 text-sm text-ivory hover:bg-white/[0.1]">
                  <ExternalLink size={15} /> View on store
                </a>
              )}
              <Button variant="danger" icon={Trash2} onClick={onDelete} disabled={busy}>
                Delete
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          <Card className="space-y-5">
            <Field label="Name" required error={form.errors.name}>
              {({ id }) => <Input id={id} value={v.name} onChange={onName} invalid={Boolean(form.errors.name)} placeholder="e.g. Rose quartz bracelet" autoFocus={isNew} />}
            </Field>
            <Field label="URL slug" error={form.errors.slug} hint={isNew && !slugEdited ? 'Filled from the name. Edit to customise.' : `Store page: /p/${slugify(v.slug) || '…'}`}>
              {({ id }) => (
                <Input
                  id={id}
                  prefix="/p/"
                  value={v.slug}
                  invalid={Boolean(form.errors.slug)}
                  onChange={(e) => {
                    setSlugEdited(true);
                    form.set('slug', e.target.value);
                  }}
                  onBlur={() => form.set('slug', slugify(v.slug))}
                />
              )}
            </Field>
            <Field label="Short description" hint="One or two lines shown near the price.">
              {({ id }) => <Textarea id={id} rows={2} maxLength={300} {...form.bind('shortDescription')} />}
            </Field>
            <Field label="Description">{({ id }) => <Textarea id={id} rows={8} {...form.bind('description')} />}</Field>
          </Card>

          <Card className="space-y-4">
            <FormSection title="Images" description="The first image is the cover. Use the arrows to reorder.">
              <GalleryInput value={v.images} onChange={(images) => form.set('images', images)} folder="products" />
            </FormSection>
          </Card>

          <Card className="space-y-4">
            <FormSection title="Pricing">
              <FormGrid>
                <Field label="Price" required error={form.errors.price}>
                  {({ id }) => <MoneyInput id={id} value={v.price} onChange={(x) => form.set('price', x)} invalid={Boolean(form.errors.price)} />}
                </Field>
                <Field label="Compare-at price" error={form.errors.compareAtPrice} hint="Shown struck through. Leave empty for none.">
                  {({ id }) => <MoneyInput id={id} value={v.compareAtPrice} onChange={(x) => form.set('compareAtPrice', x)} />}
                </Field>
                <Field label="SKU" error={form.errors.sku} hint={isNew ? 'Leave empty to generate one.' : 'Leave empty to clear.'}>
                  {({ id }) => <Input id={id} {...form.bind('sku')} />}
                </Field>
              </FormGrid>
            </FormSection>
          </Card>

          <Card>
            <AttributesEditor rows={v.attributes} onChange={(rows) => form.set('attributes', rows)} defs={defs} loading={attributeDefs.isLoading} />
          </Card>

          <Card>
            <SeoFields form={form} folder="products" />
          </Card>
        </div>

        {/* Side column */}
        <div className="min-w-0 space-y-4">
          <Card className="space-y-4">
            <Switch label="Active" description="Inactive products are hidden from the store." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
            <Switch label="Featured" description="Shown in the homepage featured rail." checked={v.featured} onChange={(x) => form.set('featured', x)} />
            {!isNew && (
              <Link to="/admin/featured" className="block text-xs text-gold hover:underline">
                Change featured order
              </Link>
            )}
          </Card>

          <Card className="space-y-4">
            <FormSection title="Organisation">
              <Field label="Family" required>
                {({ id }) => <Select id={id} options={FAMILIES} {...form.bind('family')} />}
              </Field>
              <Field label="Category">
                <CategorySelect value={v.categoryId} onChange={(x) => form.set('categoryId', x || '')} />
              </Field>
              <Field label="Collections" hint="Rule-based collections (best sellers, new arrivals…) pick products automatically.">
                <CollectionChecks collections={collections} value={v.collectionIds} onChange={(ids) => form.set('collectionIds', ids)} />
              </Field>
            </FormSection>
          </Card>

          <Card className="space-y-4">
            <FormSection title="Inventory">
              {isNew ? (
                <FormGrid>
                  <Field label="Starting stock">
                    {({ id }) => <NumberInput id={id} min={0} value={v.stock} onChange={(x) => form.set('stock', x)} />}
                  </Field>
                  <Field label="Low-stock alert at">
                    {({ id }) => <NumberInput id={id} min={0} value={v.lowStockLimit} onChange={(x) => form.set('lowStockLimit', x)} />}
                  </Field>
                </FormGrid>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] px-3 py-2">
                    <span className="text-xs text-lilac">In stock</span>
                    <StockCell product={{ ...product, lowStockLimit: v.lowStockLimit === '' ? product?.lowStockLimit : v.lowStockLimit }} />
                  </div>
                  <p className="text-xs text-lilac">
                    Stock changes go through{' '}
                    <Link to={`/admin/inventory?q=${encodeURIComponent(product?.sku || product?.name || '')}`} className="text-gold hover:underline">
                      Inventory
                    </Link>{' '}
                    so every change is logged with a reason.
                  </p>
                  <Field label="Low-stock alert at">
                    {({ id }) => <NumberInput id={id} min={0} value={v.lowStockLimit} onChange={(x) => form.set('lowStockLimit', x)} />}
                  </Field>
                </>
              )}
            </FormSection>
          </Card>

          <Card className="space-y-4">
            <FormSection title="Display">
              <Field label="Colour" hint="Used as a placeholder when there is no image.">
                {({ id }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick colour"
                      value={/^#[0-9a-f]{6}$/i.test(v.colorHex) ? v.colorHex : '#6B3FA0'}
                      onChange={(e) => form.set('colorHex', e.target.value)}
                      className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-raised p-1"
                    />
                    <Input id={id} {...form.bind('colorHex')} maxLength={9} />
                  </div>
                )}
              </Field>
              <FormGrid>
                <Field label="Rating" error={form.errors.rating}>
                  {({ id }) => <NumberInput id={id} min={0} max={5} step={0.1} value={v.rating} onChange={(x) => form.set('rating', x)} />}
                </Field>
                <Field label="Review count" hint="Empty = automatic.">
                  {({ id }) => <NumberInput id={id} min={0} value={v.reviewCount} onChange={(x) => form.set('reviewCount', x)} />}
                </Field>
              </FormGrid>
            </FormSection>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-white/[0.08] bg-ink/95 backdrop-blur md:-mx-8">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
          <span className="truncate text-sm text-lilac">{form.dirty ? 'Unsaved changes' : isNew ? 'New product' : 'All changes saved'}</span>
          <div className="flex items-center gap-2">
            {form.dirty && !isNew && (
              <Button variant="ghost" onClick={() => form.reset()} disabled={busy}>
                Discard
              </Button>
            )}
            {isNew && (
              <Button variant="ghost" onClick={() => navigate('/admin/products')} disabled={busy}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit" icon={Save} loading={save.isPending} disabled={busy || (!isNew && !form.dirty)}>
              {isNew ? 'Create product' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function CollectionChecks({ collections, value, onChange }) {
  const all = collections.data?.collections || [];
  if (collections.isLoading) return <Skeleton className="h-16" />;
  if (collections.error) return <p className="text-xs text-rose-300">Could not load collections.</p>;
  const manual = all.filter((c) => (c.ruleType || 'manual') === 'manual');
  if (!manual.length) {
    return (
      <p className="text-xs text-lilac">
        No manual collections yet.{' '}
        <Link to="/admin/collections" className="text-gold hover:underline">
          Create one
        </Link>
      </p>
    );
  }
  const set = new Set(value);
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/[0.08] p-3">
      {manual.map((c) => (
        <Checkbox
          key={c._id}
          className="flex"
          checked={set.has(String(c._id))}
          onChange={(on) => onChange(on ? [...value, String(c._id)] : value.filter((x) => x !== String(c._id)))}
          label={
            <span>
              {c.name}
              {c.isActive === false && <span className="text-lilac"> (hidden)</span>}
            </span>
          }
        />
      ))}
    </div>
  );
}

function AttributesEditor({ rows = [], onChange, defs, loading }) {
  const used = new Set(rows.map((r) => r.key));
  const unused = defs.filter((d) => d.slug && !used.has(d.slug));
  const defFor = (key) => defs.find((d) => d.slug === key || d.name === key);
  const update = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <FormSection title="Attributes" description="Details listed on the product page, like origin or chakra.">
      {rows.length === 0 && <p className="text-xs text-lilac">No attributes yet.</p>}
      <datalist id="attr-keys">
        {defs.map((d) => (
          <option key={d._id} value={d.slug}>
            {d.name}
          </option>
        ))}
      </datalist>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const def = defFor(row.key);
          return (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-start gap-2">
              <div>
                <Input value={row.key} onChange={(e) => update(i, { key: e.target.value })} list="attr-keys" placeholder="Name (e.g. origin)" aria-label="Attribute name" />
                {def && def.name !== row.key && <p className="mt-0.5 truncate text-[11px] text-lilac/70">{def.name}</p>}
              </div>
              <div>
                {def?.type === 'select' && def.options?.length ? (
                  <Select value={row.value} onChange={(e) => update(i, { value: e.target.value })} options={def.options.includes(row.value) || !row.value ? def.options : [row.value, ...def.options]} placeholder="Choose…" aria-label="Attribute value" />
                ) : (
                  <Input value={row.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="Value" aria-label="Attribute value" />
                )}
              </div>
              <IconButton icon={X} label="Remove attribute" onClick={() => onChange(rows.filter((_, j) => j !== i))} />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" icon={Plus} onClick={() => onChange([...rows, { key: '', value: '' }])}>
          Add attribute
        </Button>
        {!loading &&
          unused.slice(0, 12).map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => onChange([...rows, { key: d.slug, value: '' }])}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-lilac hover:border-gold/40 hover:text-ivory"
            >
              + {d.name}
            </button>
          ))}
      </div>
      <p className="text-[11px] text-lilac/70">Rows with an empty name or value are not saved.</p>
    </FormSection>
  );
}
