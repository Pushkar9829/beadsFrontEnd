// Shared bits for the catalog pages (products, categories, collections, inventory, featured).
import { mediaUrl } from '../../../api/client';
import { Badge, Field, FormGrid, FormSection, Input, MediaInput, Switch, Textarea } from '../../ui';

export const FAMILIES = [
  { value: 'crystals', label: 'Crystals' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'gemstones', label: 'Gemstones' },
];
export const familyLabel = (v) => FAMILIES.find((f) => f.value === v)?.label || v || '—';

/** Every cache a product write can affect. */
export const PRODUCT_INVALIDATE = ['/products/admin', '/admin/inventory', '/admin/featured', '/admin/dashboard', '/admin/collections', '/admin/flash-sales', '/admin/offers'];
export const CATEGORY_INVALIDATE = ['/categories/admin', '/products/admin'];
export const COLLECTION_INVALIDATE = ['/admin/collections'];

export const EMPTY_SEO = { title: '', description: '', keywords: '', ogImage: '', noIndex: false };

/** Populated ref ({_id,name}) or plain id → id string ('' when empty). */
export const refId = (v) => (v && typeof v === 'object' ? String(v._id || '') : v ? String(v) : '');

export function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export const firstImage = (p) => (p?.images?.[0] ? mediaUrl(p.images[0]) : '');

/** ok | low | out, using the API's stockStatus when present. */
export function stockState(p) {
  if (p?.stockStatus) return p.stockStatus;
  const stock = Number(p?.stock) || 0;
  if (stock <= 0) return 'out';
  if (stock <= (p?.lowStockLimit ?? 5)) return 'low';
  return 'ok';
}

export function StockCell({ product }) {
  const state = stockState(product);
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      {Number(product?.stock) || 0}
      {state === 'out' && <Badge tone="danger">Out</Badge>}
      {state === 'low' && <Badge tone="warning">Low</Badge>}
    </span>
  );
}

/** SEO block bound to `form` under the `seo.` path. Keep the whole object in form state (server merges in v2). */
export function SeoFields({ form, folder = 'seo', showKeywords = true, imageLabel = 'Share image' }) {
  const seo = form.values.seo || EMPTY_SEO;
  return (
    <FormSection title="Search & sharing" description="Leave blank to use the name, description and first image.">
      <Field label="SEO title" hint={`${(seo.title || '').length}/70`}>
        {({ id }) => <Input id={id} maxLength={120} {...form.bind('seo.title')} />}
      </Field>
      <Field label="SEO description" hint={`${(seo.description || '').length}/160`}>
        {({ id }) => <Textarea id={id} rows={3} maxLength={320} {...form.bind('seo.description')} />}
      </Field>
      {showKeywords && (
        <Field label="Keywords" hint="Comma separated.">
          {({ id }) => <Input id={id} {...form.bind('seo.keywords')} />}
        </Field>
      )}
      <FormGrid>
        <Field label={imageLabel}>
          <MediaInput value={seo.ogImage || ''} onChange={(v) => form.set('seo.ogImage', v || '')} folder={folder} aspect="aspect-[1.91/1]" />
        </Field>
      </FormGrid>
      <Switch label="Hide from search engines" description="Adds noindex to this page." checked={Boolean(seo.noIndex)} onChange={(v) => form.set('seo.noIndex', v)} />
    </FormSection>
  );
}
