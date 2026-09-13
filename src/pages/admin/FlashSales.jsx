import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const empty = { name: '', startsAt: '', endsAt: '', isActive: true, items: [] };

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [report, setReport] = useState(null);

  const load = () => {
    api.get('/admin/flash-sales').then(({ data }) => setSales(data.sales || []));
    api.get('/products/admin/all').then(({ data }) => setProducts(data.products || []));
  };
  useEffect(() => { load(); }, []);

  function payload() {
    return {
      ...form,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
      items: (form.items || []).map((i) => ({
        productId: i.productId,
        salePrice: i.salePrice === '' ? undefined : Number(i.salePrice),
        percent: i.percent === '' ? undefined : Number(i.percent),
      })),
    };
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/flash-sales/${editing}`, payload());
      else await api.post('/admin/flash-sales', payload());
      toast(editing ? 'Campaign saved.' : 'Campaign created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save.', 'error');
    }
  }

  function addItem() {
    setForm({ ...form, items: [...(form.items || []), { productId: products[0]?._id || '', salePrice: '', percent: '' }] });
  }

  return (
    <div>
      <AdminHeader title="Flash sale" subtitle="Timed campaigns with a storefront countdown and performance totals." onCreate={() => { setEditing(null); setForm(empty); setOpen(true); }} createLabel="Create campaign" />
      <AdminTable
        rows={sales}
        empty="No flash sales yet."
        columns={[
          { key: 'name', label: 'Campaign', render: (s) => <span className="font-medium">{s.name}</span> },
          { key: 'window', label: 'Window', render: (s) => `${new Date(s.startsAt).toLocaleString('en-IN')} – ${new Date(s.endsAt).toLocaleString('en-IN')}` },
          { key: 'items', label: 'Products', render: (s) => s.items?.length || 0 },
          { key: 'revenue', label: 'Revenue', render: (s) => <Price value={s.revenue} /> },
          { key: 'live', label: 'Status', render: (s) => <StatusBadge kind="coupon" value={s.live ? 'active' : s.isActive ? 'scheduled' : 'inactive'} /> },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (s) => (
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold" onClick={async () => {
                  const { data } = await api.get(`/admin/flash-sales/${s._id}/performance`);
                  setReport(data);
                }}>Report</button>
                <RowActions
                  onEdit={() => {
                    setEditing(s._id);
                    setForm({
                      ...empty,
                      ...s,
                      startsAt: s.startsAt ? s.startsAt.slice(0, 16) : '',
                      endsAt: s.endsAt ? s.endsAt.slice(0, 16) : '',
                      items: (s.items || []).map((i) => ({
                        productId: i.productId?._id || i.productId,
                        salePrice: i.salePrice ?? '',
                        percent: i.percent ?? '',
                      })),
                    });
                    setOpen(true);
                  }}
                  onDelete={() => setRemove(s)}
                />
              </div>
            ),
          },
        ]}
      />
      <AdminDrawer open={open} title={editing ? 'Edit campaign' : 'Create campaign'} onClose={() => setOpen(false)} wide>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Starts<input required type="datetime-local" className={`${fieldClass} mt-1`} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className={labelClass}>Ends<input required type="datetime-local" className={`${fieldClass} mt-1`} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className={labelClass}>Products</p>
              <button type="button" onClick={addItem} className="text-xs uppercase tracking-widest text-gold">Add product</button>
            </div>
            {(form.items || []).map((item, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-3">
                <select className={fieldClass} value={item.productId} onChange={(e) => {
                  const items = [...form.items];
                  items[i] = { ...items[i], productId: e.target.value };
                  setForm({ ...form, items });
                }}>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input className={fieldClass} type="number" placeholder="Sale price" value={item.salePrice} onChange={(e) => {
                  const items = [...form.items];
                  items[i] = { ...items[i], salePrice: e.target.value };
                  setForm({ ...form, items });
                }} />
                <input className={fieldClass} type="number" placeholder="% off" value={item.percent} onChange={(e) => {
                  const items = [...form.items];
                  items[i] = { ...items[i], percent: e.target.value };
                  setForm({ ...form, items });
                }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <AdminDrawer open={!!report} title="Flash-sale performance" onClose={() => setReport(null)}>
        {report && (
          <div className="space-y-2 text-sm text-lilac">
            <p className="font-serif text-xl text-gold">{report.sale?.name}</p>
            <p>Units sold: {report.report?.unitsSold || 0}</p>
            <p>Revenue: <Price value={report.report?.revenue} /></p>
            <p>Discount cost: <Price value={report.report?.discountCost} /></p>
          </div>
        )}
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete campaign"
        body={remove ? `Remove “${remove.name}”?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/admin/flash-sales/${remove._id}`);
          setRemove(null);
          toast('Campaign deleted.');
          load();
        }}
      />
    </div>
  );
}
