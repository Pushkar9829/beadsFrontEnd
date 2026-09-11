import { useEffect, useMemo, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { FilterSelect, paginate, Pagination } from '../../components/admin/AdminToolbar';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const empty = {
  name: '', family: 'crystals', categoryId: '', sku: '', description: '', shortDescription: '',
  price: 0, compareAtPrice: '', stock: 0, lowStockLimit: 5, featured: false, isActive: true,
  colorHex: '#6B3FA0', imagesText: '', collectionIds: [],
};

function stockStatus(p) {
  if (p.stock <= 0) return 'out';
  if (p.stock <= (p.lowStockLimit ?? 5)) return 'low';
  return 'ok';
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [family, setFamily] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    api.get('/products/admin/all').then(({ data }) => setProducts(data.products || []));
    api.get('/categories/admin/all').then(({ data }) => setCategories(data.categories || []));
    api.get('/admin/collections').then(({ data }) => setCollections(data.collections || []));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => products.filter((p) => {
    if (family !== 'all' && p.family !== family) return false;
    const hay = `${p.name} ${p.sku || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [products, q, family]);
  const { slice, total, pages, page: p } = paginate(filtered, page);
  useEffect(() => { setPage(1); }, [q, family]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(prod) {
    setEditing(prod._id);
    setForm({
      ...empty,
      ...prod,
      categoryId: prod.categoryId?._id || prod.categoryId || '',
      collectionIds: (prod.collectionIds || []).map((c) => c._id || c),
      compareAtPrice: prod.compareAtPrice || '',
      imagesText: (prod.images || []).join(', '),
      sku: prod.sku || '',
      lowStockLimit: prod.lowStockLimit ?? 5,
    });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockLimit: Number(form.lowStockLimit || 5),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      categoryId: form.categoryId || undefined,
      collectionIds: form.collectionIds,
      sku: form.sku || undefined,
      images: form.imagesText ? form.imagesText.split(',').map((s) => s.trim()).filter(Boolean) : form.images,
    };
    delete payload.imagesText;
    try {
      if (editing) await api.put(`/products/admin/${editing}`, payload);
      else await api.post('/products/admin', payload);
      toast(editing ? 'Product saved.' : 'Product created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save product.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Products" subtitle="SKU, stock alerts, and collections live on each piece." onCreate={openCreate} createLabel="Create product" />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Name or SKU"
        filters={
          <FilterSelect
            value={family}
            onChange={setFamily}
            options={[{ value: 'all', label: 'All families' }, { value: 'crystals', label: 'Crystals' }, { value: 'rudraksha', label: 'Rudraksha' }, { value: 'gemstones', label: 'Gemstones' }]}
          />
        }
      />
      <AdminTable
        rows={slice}
        empty="No products match."
        columns={[
          {
            key: 'item',
            label: 'Product',
            render: (prod) => (
              <div className="flex items-center gap-3">
                {prod.images?.[0] ? <img src={mediaUrl(prod.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-raised" />}
                <div>
                  <div className="font-medium text-ivory">{prod.name}</div>
                  <div className="text-xs text-lilac">{prod.sku || 'No SKU'}</div>
                </div>
              </div>
            ),
          },
          { key: 'family', label: 'Family' },
          { key: 'price', label: 'Price', render: (prod) => <Price value={prod.price} /> },
          { key: 'stock', label: 'Stock', render: (prod) => (
            <span className="flex items-center gap-2">{prod.stock} <StatusBadge kind="stock" value={stockStatus(prod)} /></span>
          ) },
          { key: 'featured', label: 'Featured', render: (prod) => prod.featured ? 'Yes' : '—' },
          { key: 'isActive', label: 'Status', render: (prod) => prod.isActive ? 'Active' : 'Hidden' },
          { key: 'actions', label: 'Actions', align: 'right', render: (prod) => <RowActions onEdit={() => openEdit(prod)} onDelete={() => setRemove(prod)} /> },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit product' : 'Create product'} onClose={() => setOpen(false)} wide>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>SKU<input className={`${fieldClass} mt-1`} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto if left blank" /></label>
          <label className={labelClass}>Family
            <select className={`${fieldClass} mt-1`} value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })}>
              <option>crystals</option><option>rudraksha</option><option>gemstones</option>
            </select>
          </label>
          <label className={labelClass}>Category
            <select className={`${fieldClass} mt-1`} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Collections
            <select
              multiple
              className={`${fieldClass} mt-1 h-28`}
              value={form.collectionIds}
              onChange={(e) => setForm({ ...form, collectionIds: [...e.target.selectedOptions].map((o) => o.value) })}
            >
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Price<input type="number" className={`${fieldClass} mt-1`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label className={labelClass}>Compare at<input type="number" className={`${fieldClass} mt-1`} value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} /></label>
          <label className={labelClass}>Stock<input type="number" className={`${fieldClass} mt-1`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
          <label className={labelClass}>Low-stock alert<input type="number" className={`${fieldClass} mt-1`} value={form.lowStockLimit} onChange={(e) => setForm({ ...form, lowStockLimit: e.target.value })} /></label>
          <label className={labelClass}>Image URLs<input className={`${fieldClass} mt-1`} value={form.imagesText || ''} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} /></label>
          <label className={labelClass}>Short description<input className={`${fieldClass} mt-1`} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></label>
          <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete product"
        body={remove ? `Remove “${remove.name}” from the catalog?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/products/admin/${remove._id}`);
          setRemove(null);
          toast('Product deleted.');
          load();
        }}
      />
    </div>
  );
}
