import { useMemo, useState } from 'react';
import { CornerDownRight, ExternalLink, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiGet, apiSend, toPayload, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { plural } from '../lib/format';
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
  NumberInput,
  PageHeader,
  SearchInput,
  Select,
  Switch,
  Textarea,
  Thumb,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { CATEGORY_INVALIDATE, EMPTY_SEO, FAMILIES, SeoFields, familyLabel, refId, slugify } from './catalog/shared';

const BASE = '/categories/admin';
const EMPTY = { name: '', slug: '', family: 'crystals', parentId: '', description: '', image: '', sortOrder: 0, isActive: true, seo: EMPTY_SEO };

const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name));

/** Flat list → depth-first rows with `depth`, built from parentId (orphans become roots). */
function flattenTree(categories) {
  const ids = new Set(categories.map((c) => String(c._id)));
  const kids = new Map();
  for (const c of categories) {
    const p = refId(c.parentId);
    const key = p && ids.has(p) && p !== String(c._id) ? p : '';
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key).push(c);
  }
  const out = [];
  const seen = new Set();
  const walk = (parent, depth) => {
    for (const c of (kids.get(parent) || []).sort(byOrder)) {
      if (seen.has(String(c._id))) continue; // guards against cycles
      seen.add(String(c._id));
      out.push({ ...c, depth, childCount: (kids.get(String(c._id)) || []).length });
      walk(String(c._id), depth + 1);
    }
  };
  walk('', 0);
  // Anything stuck in a cycle still shows up.
  for (const c of categories) if (!seen.has(String(c._id))) out.push({ ...c, depth: 0, childCount: 0 });
  return out;
}

function descendantsOf(id, categories) {
  const out = new Set();
  let frontier = [String(id)];
  while (frontier.length) {
    const next = [];
    for (const c of categories) {
      const p = refId(c.parentId);
      if (frontier.includes(p) && !out.has(String(c._id))) {
        out.add(String(c._id));
        next.push(String(c._id));
      }
    }
    frontier = next;
  }
  return out;
}

export default function Categories() {
  const [state, set] = useUrlState({ q: '', family: 'all', active: 'all' });
  const [editing, setEditing] = useState(null); // null | { ...EMPTY overrides, isNew } | category
  const confirm = useConfirm();
  const query = useApiQuery(`${BASE}/all`);
  const categories = useMemo(() => query.data?.categories || [], [query.data]);

  const rows = useMemo(() => {
    const flat = flattenTree(categories);
    const q = state.q.trim().toLowerCase();
    return flat.filter((c) => {
      if (state.family !== 'all' && c.family !== state.family) return false;
      if (state.active !== 'all' && String(c.isActive !== false) !== state.active) return false;
      if (q && !`${c.name} ${c.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, state]);
  const searching = Boolean(state.q || state.family !== 'all' || state.active !== 'all');

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: CATEGORY_INVALIDATE, success: 'Category deleted.' });

  const onDelete = async (c) => {
    const children = categories.filter((x) => refId(x.parentId) === String(c._id)).length;
    let products = null;
    try {
      const res = await apiGet('/products/admin/all', { categoryId: c._id, limit: 1, page: 1 });
      products = Number(res?.pagination?.total ?? res?.products?.length ?? 0);
    } catch {
      products = null;
    }
    const warnings = [];
    if (children) warnings.push(`${plural(children, 'subcategory', 'subcategories')} will be left without a parent (they show at the top level here).`);
    if (products) warnings.push(`${plural(products, 'product')} will be left without a category.`);
    if (products === null) warnings.push('Products in this category will be left without a category.');
    const ok = await confirm({
      title: `Delete “${c.name}”?`,
      message: (
        <div className="space-y-1">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <p>To hide it instead, switch it to inactive.</p>
        </div>
      ),
      confirmLabel: 'Delete category',
      tone: 'danger',
      typeToConfirm: children || products ? c.name : undefined,
    });
    if (ok) remove.mutate(c._id);
  };

  const columns = [
    {
      key: 'name',
      header: 'Category',
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3" style={{ paddingLeft: Math.min(c.depth, 4) * 20 }}>
          {c.depth > 0 && <CornerDownRight size={14} className="shrink-0 text-lilac/60" />}
          <Thumb src={c.image ? mediaUrl(c.image) : ''} size={32} />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="truncate text-xs text-lilac">/c/{c.slug}</div>
          </div>
        </div>
      ),
    },
    { key: 'family', header: 'Family', hideBelow: 'sm', render: (c) => familyLabel(c.family) },
    { key: 'children', header: 'Subcategories', hideBelow: 'md', align: 'right', render: (c) => c.childCount || '—' },
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
            { label: 'Add subcategory', icon: Plus, onClick: () => setEditing({ isNew: true, parentId: String(c._id), family: c.family }) },
            { label: 'View on store', icon: ExternalLink, onClick: () => window.open(`/c/${c.slug}`, '_blank', 'noopener') },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => onDelete(c) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        description="The store menu tree. Subcategories show inside their parent’s page."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ isNew: true })}>
            New category
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search categories…" />
        <FilterSelect label="Family" value={state.family} onChange={(family) => set({ family })} options={[{ value: 'all', label: 'All families' }, ...FAMILIES]} />
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
        dense
        empty={
          <EmptyState
            icon={FolderTree}
            title={searching ? 'No categories match' : 'No categories yet'}
            action={
              !searching && (
                <Button icon={Plus} onClick={() => setEditing({ isNew: true })}>
                  New category
                </Button>
              )
            }
          />
        }
        footer={
          !query.isLoading && categories.length > 0 ? (
            <div className="border-t border-white/[0.08] px-4 py-2.5 text-xs text-lilac">{plural(searching ? rows.length : categories.length, 'category', 'categories')}</div>
          ) : null
        }
      />
      <CategoryDrawer key={editing?._id || (editing ? `new-${editing.parentId || ''}` : 'none')} category={editing} categories={categories} onClose={() => setEditing(null)} />
    </>
  );
}

function CategoryDrawer({ category, categories, onClose }) {
  const isNew = Boolean(category?.isNew);
  const initial = useMemo(() => {
    if (!category) return EMPTY;
    if (isNew) return { ...EMPTY, parentId: category.parentId || '', family: category.family || EMPTY.family };
    return {
      name: category.name || '',
      slug: category.slug || '',
      family: category.family || 'crystals',
      parentId: refId(category.parentId),
      description: category.description || '',
      image: category.image || '',
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
      seo: { ...EMPTY_SEO, ...(category.seo || {}) },
    };
  }, [category, isNew]);
  const form = useForm(initial);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const v = form.values;

  // Parent must be in the same family and must not be this category or one of its descendants.
  const parentOptions = useMemo(() => {
    const blocked = isNew || !category ? new Set() : new Set([String(category._id), ...descendantsOf(category._id, categories)]);
    return flattenTree(categories.filter((c) => c.family === v.family))
      .filter((c) => !blocked.has(String(c._id)))
      .map((c) => ({ value: String(c._id), label: `${'— '.repeat(c.depth)}${c.name}${c.isActive === false ? ' (hidden)' : ''}` }));
  }, [categories, v.family, category, isNew]);

  const save = useApiMutation(
    async (values) => {
      const body = toPayload({ ...values, slug: slugify(values.slug) }, { numbers: ['sortOrder'], nullable: ['parentId'] });
      if (!isNew) return apiSend('put', `${BASE}/${category._id}`, body);
      if (!body.slug) delete body.slug;
      return apiSend('post', BASE, body);
    },
    {
      invalidate: CATEGORY_INVALIDATE,
      success: isNew ? 'Category created.' : 'Category saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => {
        const errs = { ...(info.fields || {}) };
        if (info.status === 409 && /slug/i.test(info.message)) errs.slug = info.message;
        form.setServerErrors(errs);
      },
    }
  );

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!v.name.trim()) errs.name = 'Name is required.';
    if (!isNew && !slugify(v.slug)) errs.slug = 'Slug is required.';
    if (Object.keys(errs).length) return form.setErrors(errs);
    save.mutate(v);
  };

  return (
    <Drawer
      open={Boolean(category)}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? 'New category' : `Edit ${category?.name || 'category'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="category-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create category' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-6">
        <FormSection>
          <Field label="Name" required error={form.errors.name}>
            {({ id }) => (
              <Input
                id={id}
                value={v.name}
                invalid={Boolean(form.errors.name)}
                autoFocus
                onChange={(e) => form.set(slugEdited ? { name: e.target.value } : { name: e.target.value, slug: slugify(e.target.value) })}
              />
            )}
          </Field>
          <Field label="URL slug" error={form.errors.slug}>
            {({ id }) => (
              <Input
                id={id}
                prefix="/c/"
                value={v.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  form.set('slug', e.target.value);
                }}
                onBlur={() => form.set('slug', slugify(v.slug))}
              />
            )}
          </Field>
          <FormGrid>
            <Field label="Family" required>
              {({ id }) => (
                <Select
                  id={id}
                  options={FAMILIES}
                  value={v.family}
                  onChange={(e) => {
                    const family = e.target.value;
                    const parent = categories.find((c) => String(c._id) === v.parentId);
                    form.set(parent && parent.family !== family ? { family, parentId: '' } : { family });
                  }}
                />
              )}
            </Field>
            <Field label="Parent" hint="Only categories in the same family.">
              {({ id }) => <Select id={id} placeholder="None (top level)" options={parentOptions} {...form.bind('parentId')} />}
            </Field>
          </FormGrid>
          <Field label="Description">{({ id }) => <Textarea id={id} rows={4} {...form.bind('description')} />}</Field>
          <FormGrid>
            <Field label="Image">
              <MediaInput value={v.image} onChange={(image) => form.set('image', image || '')} folder="category" />
            </Field>
            <div className="space-y-4">
              <Field label="Sort order" hint="Lower numbers show first.">
                {({ id }) => <NumberInput id={id} value={v.sortOrder} onChange={(x) => form.set('sortOrder', x)} />}
              </Field>
              <Switch label="Active" description="Hidden categories disappear from the store menu." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
            </div>
          </FormGrid>
        </FormSection>
        <SeoFields form={form} folder="category" />
      </form>
    </Drawer>
  );
}
