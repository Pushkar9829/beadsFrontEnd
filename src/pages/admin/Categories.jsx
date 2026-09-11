import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';

const empty = { name: '', family: 'crystals', parentId: '', description: '', sortOrder: 0, isActive: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.get('/categories/admin/all').then(({ data }) => setCategories(data.categories || []));
  useEffect(() => { load(); }, []);

  const parentName = (id) => categories.find((c) => String(c._id) === String(id))?.name || '—';
  const filtered = useMemo(() => categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [categories, q]);
  const { slice, total, pages, page: p } = paginate(filtered, page);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(c) {
    setEditing(c._id);
    setForm({ ...empty, ...c, parentId: c.parentId || '' });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, parentId: form.parentId || null, sortOrder: Number(form.sortOrder) };
    if (editing) await api.put(`/categories/admin/${editing}`, payload);
    else await api.post('/categories/admin', payload);
    setOpen(false);
    setForm(empty);
    setEditing(null);
    load();
  }

  return (
    <div>
      <AdminHeader
        title="Categories"
        subtitle="Trees stay expandable — new collections appear in the storefront menu automatically."
        onCreate={openCreate}
        createLabel="Create category"
      />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search categories" />
      <AdminTable
        rows={slice}
        columns={[
          { key: 'name', label: 'Name', render: (c) => <span className="font-medium text-ivory">{c.name}</span> },
          { key: 'family', label: 'Family' },
          { key: 'parent', label: 'Parent', render: (c) => parentName(c.parentId) },
          { key: 'sortOrder', label: 'Sort' },
          { key: 'isActive', label: 'Status', render: (c) => c.isActive ? 'Active' : 'Hidden' },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (c) => <RowActions onEdit={() => openEdit(c)} onDelete={() => setRemove(c)} />,
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit category' : 'Create category'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Family
            <select className={`${fieldClass} mt-1`} value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })}>
              <option value="crystals">crystals</option>
              <option value="rudraksha">rudraksha</option>
              <option value="gemstones">gemstones</option>
            </select>
          </label>
          <label className={labelClass}>Parent
            <select className={`${fieldClass} mt-1`} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Root</option>
              {categories.filter((c) => c.family === form.family && c._id !== editing).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>Sort<input type="number" className={`${fieldClass} mt-1`} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
          <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete category"
        body={remove ? `Remove “${remove.name}” from the catalog tree?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/categories/admin/${remove._id}`);
          setRemove(null);
          load();
        }}
      />
    </div>
  );
}
