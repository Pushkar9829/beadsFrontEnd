import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const empty = { name: '', type: 'percent', percent: 10, amountOff: '', minOrder: '', buyQty: 1, getQty: 1, categoryId: '', isActive: true };

const TYPE_LABEL = {
  bogo: 'BOGO',
  percent: 'Percent off',
  free_shipping: 'Free shipping',
  fixed: 'Amount off',
  bundle: 'Bundle',
};

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    api.get('/admin/offers').then(({ data }) => setOffers(data.offers || []));
    api.get('/categories/admin/all').then(({ data }) => setCategories(data.categories || []));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => offers.filter((o) => o.name.toLowerCase().includes(q.toLowerCase())), [offers, q]);
  const { slice, total, pages, page: p } = paginate(filtered, page);

  function payload() {
    return {
      ...form,
      percent: form.percent === '' ? undefined : Number(form.percent),
      amountOff: form.amountOff === '' ? undefined : Number(form.amountOff),
      minOrder: form.minOrder === '' ? undefined : Number(form.minOrder),
      buyQty: Number(form.buyQty || 1),
      getQty: Number(form.getQty || 1),
      categoryId: form.categoryId || undefined,
    };
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/offers/${editing}`, payload());
      else await api.post('/admin/offers', payload());
      toast(editing ? 'Offer saved.' : 'Offer created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save offer.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Offers" subtitle="Automatic promotions: percent off, BOGO, free shipping, bundles." onCreate={() => { setEditing(null); setForm(empty); setOpen(true); }} createLabel="Create offer" />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search offers" />
      <AdminTable
        rows={slice}
        empty="No offers yet."
        columns={[
          { key: 'name', label: 'Offer', render: (o) => <span className="font-medium">{o.name}</span> },
          { key: 'type', label: 'Type', render: (o) => TYPE_LABEL[o.type] || o.type },
          { key: 'detail', label: 'Detail', render: (o) => o.type === 'percent' ? `${o.percent}%` : o.type === 'fixed' ? `₹${o.amountOff}` : o.type === 'bogo' ? `Buy ${o.buyQty} get ${o.getQty}` : o.minOrder ? `Min ₹${o.minOrder}` : '—' },
          { key: 'isActive', label: 'Status', render: (o) => <StatusBadge kind="coupon" value={o.isActive ? 'active' : 'inactive'} /> },
          { key: 'actions', label: 'Actions', align: 'right', render: (o) => (
            <RowActions
              onEdit={() => {
                setEditing(o._id);
                setForm({ ...empty, ...o, categoryId: o.categoryId?._id || o.categoryId || '', percent: o.percent ?? '', amountOff: o.amountOff ?? '', minOrder: o.minOrder ?? '' });
                setOpen(true);
              }}
              onDelete={() => setRemove(o)}
            />
          ) },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit offer' : 'Create offer'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Type
            <select className={`${fieldClass} mt-1`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {form.type === 'percent' && <label className={labelClass}>Percent<input type="number" className={`${fieldClass} mt-1`} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} /></label>}
          {form.type === 'fixed' && <label className={labelClass}>Amount off<input type="number" className={`${fieldClass} mt-1`} value={form.amountOff} onChange={(e) => setForm({ ...form, amountOff: e.target.value })} /></label>}
          {form.type === 'bogo' && (
            <>
              <label className={labelClass}>Buy qty<input type="number" className={`${fieldClass} mt-1`} value={form.buyQty} onChange={(e) => setForm({ ...form, buyQty: e.target.value })} /></label>
              <label className={labelClass}>Get qty<input type="number" className={`${fieldClass} mt-1`} value={form.getQty} onChange={(e) => setForm({ ...form, getQty: e.target.value })} /></label>
            </>
          )}
          <label className={labelClass}>Min order (optional)<input type="number" className={`${fieldClass} mt-1`} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></label>
          <label className={labelClass}>Category (optional)
            <select className={`${fieldClass} mt-1`} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete offer"
        body={remove ? `Remove “${remove.name}”?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/admin/offers/${remove._id}`);
          setRemove(null);
          toast('Offer deleted.');
          load();
        }}
      />
    </div>
  );
}
