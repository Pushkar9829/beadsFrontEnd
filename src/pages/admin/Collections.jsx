import { useEffect, useMemo, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const empty = { name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true };

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.get('/admin/collections').then(({ data }) => setCollections(data.collections || []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => collections.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [collections, q]
  );
  const { slice, total, pages, page: p } = paginate(filtered, page);
  useEffect(() => { setPage(1); }, [q]);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/collections/${editing}`, form);
      else await api.post('/admin/collections', form);
      toast(editing ? 'Collection saved.' : 'Collection created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save collection.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Collections" subtitle="Curated groups of products — independent of category trees." onCreate={() => { setEditing(null); setForm(empty); setOpen(true); }} createLabel="Create collection" />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search collections" />
      <AdminTable
        rows={slice}
        empty="No collections yet."
        columns={[
          {
            key: 'item',
            label: 'Collection',
            render: (c) => (
              <div className="flex items-center gap-3">
                {c.image ? <img src={mediaUrl(c.image)} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-raised" />}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-lilac">{c.slug}</div>
                </div>
              </div>
            ),
          },
          { key: 'sortOrder', label: 'Sort' },
          { key: 'isActive', label: 'Status', render: (c) => c.isActive ? <StatusBadge kind="coupon" value="active" /> : <StatusBadge kind="coupon" value="inactive" /> },
          { key: 'actions', label: 'Actions', align: 'right', render: (c) => <RowActions onEdit={() => { setEditing(c._id); setForm({ ...empty, ...c }); setOpen(true); }} onDelete={() => setRemove(c)} /> },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit collection' : 'Create collection'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={`${fieldClass} mt-1`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></label>
          <label className={labelClass}>Image URL<input className={`${fieldClass} mt-1`} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
          <label className={labelClass}>Sort<input type="number" className={`${fieldClass} mt-1`} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
          <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete collection"
        body={remove ? `Remove “${remove.name}”? Products stay; they just leave this collection.` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/admin/collections/${remove._id}`);
          setRemove(null);
          toast('Collection deleted.');
          load();
        }}
      />
    </div>
  );
}
