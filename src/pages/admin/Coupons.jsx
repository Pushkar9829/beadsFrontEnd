import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
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
  code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: '',
  applyTo: 'all', audience: 'all', usageLimit: '', perCustomerLimit: 1,
  startsAt: '', endsAt: '', isActive: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [usage, setUsage] = useState(null);

  const load = () => api.get('/admin/coupons').then(({ data }) => setCoupons(data.coupons || []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => coupons.filter((c) => {
    if (status !== 'all' && c.status !== status) return false;
    return c.code.toLowerCase().includes(q.toLowerCase());
  }), [coupons, q, status]);
  const { slice, total, pages, page: p } = paginate(filtered, page);
  useEffect(() => { setPage(1); }, [q, status]);

  function payload() {
    return {
      ...form,
      value: Number(form.value),
      minOrder: Number(form.minOrder || 0),
      maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
      usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
      perCustomerLimit: Number(form.perCustomerLimit || 1),
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
    };
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/coupons/${editing}`, payload());
      else await api.post('/admin/coupons', payload());
      toast(editing ? 'Coupon saved.' : 'Coupon created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save coupon.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Coupons" subtitle="Percent or fixed discounts. Codes are stored uppercase." onCreate={() => { setEditing(null); setForm(empty); setOpen(true); }} createLabel="Create coupon" />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search code"
        filters={<FilterSelect value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'expired', label: 'Expired' }, { value: 'inactive', label: 'Inactive' }]} />}
      />
      <AdminTable
        rows={slice}
        empty="No coupons yet."
        columns={[
          { key: 'code', label: 'Code', render: (c) => <span className="font-medium tracking-widest">{c.code}</span> },
          { key: 'type', label: 'Type', render: (c) => c.type === 'percent' ? `${c.value}%` : `₹${c.value}` },
          { key: 'minOrder', label: 'Min order' },
          { key: 'usedCount', label: 'Used', render: (c) => `${c.usedCount || 0}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
          { key: 'revenueGenerated', label: 'Revenue', render: (c) => <Price value={c.revenueGenerated} /> },
          { key: 'discountCost', label: 'Discount cost', render: (c) => <Price value={c.discountCost} /> },
          { key: 'status', label: 'Status', render: (c) => <StatusBadge kind="coupon" value={c.status} /> },
          { key: 'actions', label: 'Actions', align: 'right', render: (c) => (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold"
                onClick={async () => {
                  const { data } = await api.get(`/admin/coupons/${c._id}/usage`);
                  setUsage({ code: c.code, history: data.history || [] });
                }}
              >
                History
              </button>
              <RowActions
                onEdit={() => {
                  setEditing(c._id);
                  setForm({
                    ...empty,
                    ...c,
                    maxDiscount: c.maxDiscount ?? '',
                    usageLimit: c.usageLimit ?? '',
                    perCustomerLimit: c.perCustomerLimit ?? 1,
                    startsAt: c.startsAt ? c.startsAt.slice(0, 16) : '',
                    endsAt: c.endsAt ? c.endsAt.slice(0, 16) : '',
                  });
                  setOpen(true);
                }}
                onDelete={() => setRemove(c)}
              />
            </div>
          ) },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit coupon' : 'Create coupon'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Code<input required className={`${fieldClass} mt-1 uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
          <label className={labelClass}>Type
            <select className={`${fieldClass} mt-1`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label className={labelClass}>Value<input type="number" required className={`${fieldClass} mt-1`} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          <label className={labelClass}>Minimum order<input type="number" className={`${fieldClass} mt-1`} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></label>
          <label className={labelClass}>Max discount (optional)<input type="number" className={`${fieldClass} mt-1`} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></label>
          <label className={labelClass}>Audience
            <select className={`${fieldClass} mt-1`} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="new">New customers</option>
              <option value="existing">Existing customers</option>
            </select>
          </label>
          <label className={labelClass}>Usage limit<input type="number" className={`${fieldClass} mt-1`} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></label>
          <label className={labelClass}>Per-customer limit<input type="number" className={`${fieldClass} mt-1`} value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} /></label>
          <label className={labelClass}>Starts<input type="datetime-local" className={`${fieldClass} mt-1`} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className={labelClass}>Ends<input type="datetime-local" className={`${fieldClass} mt-1`} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <AdminDrawer open={!!usage} title={usage ? `Usage · ${usage.code}` : 'Usage'} onClose={() => setUsage(null)}>
        {usage && (
          <ul className="space-y-2 text-sm text-lilac">
            {usage.history.map((h) => (
              <li key={h._id} className="flex justify-between gap-3 border-b border-gold/10 py-2">
                <span>
                  {h.userId?.name || h.userId?.email || 'Customer'}
                  {h.orderId?.orderNumber ? ` · ${h.orderId.orderNumber}` : ''}
                </span>
                <span>{new Date(h.createdAt).toLocaleString('en-IN')}</span>
              </li>
            ))}
            {!usage.history.length && <li>No uses recorded yet.</li>}
          </ul>
        )}
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete coupon"
        body={remove ? `Remove code ${remove.code}?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/admin/coupons/${remove._id}`);
          setRemove(null);
          toast('Coupon deleted.');
          load();
        }}
      />
    </div>
  );
}
