import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

const empty = {
  name: '', family: 'crystals', categoryId: '', description: '', shortDescription: '',
  price: 0, compareAtPrice: '', stock: 0, featured: false, isActive: true, colorHex: '#6B3FA0', imagesText: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);

  const load = () => {
    api.get('/products/admin/all').then(({ data }) => setProducts(data.products || []));
    api.get('/categories/admin/all').then(({ data }) => setCategories(data.categories || []));
  };
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(p) {
    setEditing(p._id);
    setForm({
      ...empty,
      ...p,
      categoryId: p.categoryId?._id || p.categoryId || '',
      compareAtPrice: p.compareAtPrice || '',
      imagesText: (p.images || []).join(', '),
    });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      categoryId: form.categoryId || undefined,
      images: form.imagesText ? form.imagesText.split(',').map((s) => s.trim()).filter(Boolean) : form.images,
    };
    delete payload.imagesText;
    if (editing) await api.put(`/products/admin/${editing}`, payload);
    else await api.post('/products/admin', payload);
    setOpen(false);
    setForm(empty);
    setEditing(null);
    load();
  }

  return (
    <div>
      <AdminHeader title="Products" subtitle="Ready-made catalog pieces." onCreate={openCreate} createLabel="Create product" />
      <AdminTable
        rows={products}
        columns={[
          {
            key: 'item',
            label: 'Product',
            render: (p) => (
              <div className="flex items-center gap-3">
                {p.images?.[0] ? <img src={mediaUrl(p.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-raised" />}
                <div>
                  <div className="font-medium text-ivory">{p.name}</div>
                  <div className="text-xs text-lilac">{p.shortDescription}</div>
                </div>
              </div>
            ),
          },
          { key: 'family', label: 'Family' },
          { key: 'price', label: 'Price', render: (p) => <Price value={p.price} /> },
          { key: 'stock', label: 'Stock' },
          { key: 'featured', label: 'Featured', render: (p) => p.featured ? 'Yes' : '—' },
          { key: 'isActive', label: 'Status', render: (p) => p.isActive ? 'Active' : 'Hidden' },
          { key: 'actions', label: 'Actions', align: 'right', render: (p) => <RowActions onEdit={() => openEdit(p)} onDelete={() => setRemove(p)} /> },
        ]}
      />
      <AdminDrawer open={open} title={editing ? 'Edit product' : 'Create product'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
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
          <label className={labelClass}>Price<input type="number" className={`${fieldClass} mt-1`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label className={labelClass}>Compare at<input type="number" className={`${fieldClass} mt-1`} value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} /></label>
          <label className={labelClass}>Stock<input type="number" className={`${fieldClass} mt-1`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
          <label className={labelClass}>Image URL<input className={`${fieldClass} mt-1`} value={form.imagesText || ''} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} /></label>
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
          load();
        }}
      />
    </div>
  );
}
