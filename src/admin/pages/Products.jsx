import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, Plus, Star } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { money, plural } from '../lib/format';
import { Badge, BulkBar, Button, DataTable, EmptyState, FilterSelect, PageHeader, Pagination, SearchInput, Thumb, Toolbar, useConfirm } from '../ui';
import { CategorySelect } from '../ui/pickers';
import { FAMILIES, PRODUCT_INVALIDATE, StockCell, familyLabel, firstImage } from './catalog/shared';

const DEFAULTS = { q: '', status: 'all', family: 'all', categoryId: '', stock: 'all', featured: 'all', sort: '-createdAt', page: 1 };

const SORTS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
  { value: 'price', label: 'Price low–high' },
  { value: '-price', label: 'Price high–low' },
  { value: 'stock', label: 'Stock low–high' },
  { value: '-stock', label: 'Stock high–low' },
];

const toSortObj = (s = '') => (s.startsWith('-') ? { key: s.slice(1), dir: 'desc' } : { key: s, dir: 'asc' });
const fromSortObj = ({ key, dir }) => (dir === 'desc' ? `-${key}` : key);

const BULK = {
  activate: { body: { isActive: true }, label: 'Activate', done: 'activated' },
  deactivate: { body: { isActive: false }, label: 'Deactivate', done: 'deactivated' },
  // featuredSort 9999 = append to the end of the Featured order (reorder there to fine-tune)
  feature: { body: { featured: true, featuredSort: 9999 }, label: 'Feature', done: 'featured' },
  unfeature: { body: { featured: false }, label: 'Unfeature', done: 'removed from featured' },
};

export default function Products() {
  const navigate = useNavigate();
  const [state, set] = useUrlState({ ...DEFAULTS, new: '' });
  const [selected, setSelected] = useState(() => new Set());
  const [progress, setProgress] = useState(null); // { done, total }
  const confirm = useConfirm();

  // Legacy entry point: /admin/products?new=1 opens the editor.
  useEffect(() => {
    if (state.new) navigate('/admin/products/new', { replace: true });
  }, [state.new, navigate]);

  const list = useApiList(
    '/products/admin/all',
    {
      q: state.q,
      status: state.status,
      family: state.family,
      categoryId: state.categoryId,
      stock: state.stock,
      featured: state.featured,
      sort: state.sort,
      page: state.page,
      limit: 25,
    },
    { key: 'products' }
  );

  const bulk = useApiMutation(
    async ({ action, ids }) => {
      const failed = [];
      setProgress({ done: 0, total: ids.length });
      for (let i = 0; i < ids.length; i += 1) {
        try {
          await apiSend('put', `/products/admin/${ids[i]}`, BULK[action].body);
        } catch {
          failed.push(ids[i]);
        }
        setProgress({ done: i + 1, total: ids.length });
      }
      return { failed, ok: ids.length - failed.length, action };
    },
    {
      invalidate: PRODUCT_INVALIDATE,
      success: ({ ok, failed, action }) =>
        failed.length ? `${plural(ok, 'product')} ${BULK[action].done}; ${failed.length} failed.` : `${plural(ok, 'product')} ${BULK[action].done}.`,
      onSuccess: ({ failed }) => {
        setSelected(new Set(failed));
        setProgress(null);
      },
      onError: () => setProgress(null),
    }
  );

  const runBulk = async (action) => {
    const ids = [...selected];
    const label = BULK[action].label.toLowerCase();
    if (!(await confirm({ title: `${BULK[action].label} ${plural(ids.length, 'product')}?`, message: `This will ${label} every selected product.`, confirmLabel: BULK[action].label }))) return;
    bulk.mutate({ action, ids });
  };

  const filtered = state.q || state.status !== 'all' || state.family !== 'all' || state.categoryId || state.stock !== 'all' || state.featured !== 'all';

  const columns = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={firstImage(p)} color={p.colorHex} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{p.name}</span>
              {p.featured && <Star size={12} className="shrink-0 fill-gold text-gold" aria-label="Featured" />}
            </div>
            <div className="truncate text-xs text-lilac">{p.sku || 'No SKU'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'md',
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{p.categoryId?.name || '—'}</div>
          <div className="text-xs text-lilac">{familyLabel(p.family)}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <div className="tabular-nums">
          <div>{money(p.price)}</div>
          {p.compareAtPrice > p.price && <div className="text-xs text-lilac line-through">{money(p.compareAtPrice)}</div>}
        </div>
      ),
    },
    { key: 'stock', header: 'Stock', sortable: true, render: (p) => <StockCell product={p} /> },
    { key: 'status', header: 'Status', render: (p) => (p.isActive === false ? <Badge>Inactive</Badge> : <Badge tone="success">Active</Badge>) },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything sold in the store. Click a product to edit it."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate('/admin/products/new')}>
            New product
          </Button>
        }
      />
      <Toolbar
        right={<FilterSelect label="Sort" value={state.sort} onChange={(sort) => set({ sort })} options={SORTS} />}
      >
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search name or SKU…" />
        <FilterSelect
          label="Status"
          value={state.status}
          onChange={(status) => set({ status })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <FilterSelect label="Family" value={state.family} onChange={(family) => set({ family })} options={[{ value: 'all', label: 'All families' }, ...FAMILIES]} />
        <div className="w-auto min-w-[10rem]">
          <CategorySelect value={state.categoryId} onChange={(categoryId) => set({ categoryId: categoryId || '' })} placeholder="All categories" />
        </div>
        <FilterSelect
          label="Stock"
          value={state.stock}
          onChange={(stock) => set({ stock })}
          options={[
            { value: 'all', label: 'Any stock' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ]}
        />
        <FilterSelect
          label="Featured"
          value={state.featured}
          onChange={(featured) => set({ featured })}
          options={[
            { value: 'all', label: 'Featured or not' },
            { value: 'true', label: 'Featured' },
            { value: 'false', label: 'Not featured' },
          ]}
        />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => set({ q: '', status: 'all', family: 'all', categoryId: '', stock: 'all', featured: 'all' })}>
            Clear filters
          </Button>
        )}
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(p) => navigate(`/admin/products/${p._id}`)}
        sort={toSortObj(state.sort)}
        onSort={(key) => {
          const cur = toSortObj(state.sort);
          const dir = cur.key === key ? (cur.dir === 'asc' ? 'desc' : 'asc') : key === 'name' ? 'asc' : 'desc';
          set({ sort: fromSortObj({ key, dir }) });
        }}
        selection={{ selected, onChange: setSelected }}
        empty={
          <EmptyState
            icon={Package}
            title={filtered ? 'No products match these filters' : 'No products yet'}
            description={filtered ? 'Try clearing a filter or searching for something else.' : 'Add your first product to start selling.'}
            action={
              !filtered && (
                <Button icon={Plus} onClick={() => navigate('/admin/products/new')}>
                  New product
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        {progress ? (
          <span className="text-xs tabular-nums text-lilac">
            Updating {progress.done}/{progress.total}…
          </span>
        ) : (
          <>
            <Button size="sm" icon={Eye} disabled={bulk.isPending} onClick={() => runBulk('activate')}>
              Activate
            </Button>
            <Button size="sm" icon={EyeOff} disabled={bulk.isPending} onClick={() => runBulk('deactivate')}>
              Deactivate
            </Button>
            <Button size="sm" icon={Star} disabled={bulk.isPending} onClick={() => runBulk('feature')}>
              Feature
            </Button>
            <Button size="sm" variant="ghost" disabled={bulk.isPending} onClick={() => runBulk('unfeature')}>
              Unfeature
            </Button>
          </>
        )}
      </BulkBar>
    </>
  );
}
