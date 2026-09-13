import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

export default function AdminCrud({
  title,
  subtitle,
  endpoint,
  createLabel = 'Create',
  empty = 'Nothing here yet.',
  searchKey = 'name',
  fields,
  columns,
  emptyForm,
  itemsKey = 'items',
}) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.get(endpoint).then(({ data }) => setRows(data[itemsKey] || data.items || data.rows || []));
  useEffect(() => { load(); }, [endpoint]);

  const filtered = useMemo(
    () => rows.filter((r) => String(r[searchKey] || r.title || r.question || r.email || '').toLowerCase().includes(q.toLowerCase())),
    [rows, q, searchKey]
  );
  const { slice, total, pages, page: p } = paginate(filtered, page);
  useEffect(() => { setPage(1); }, [q]);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`${endpoint}/${editing}`, form);
      else await api.post(endpoint, form);
      toast(editing ? 'Saved.' : 'Created.');
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title={title} subtitle={subtitle} onCreate={() => { setEditing(null); setForm(emptyForm); setOpen(true); }} createLabel={createLabel} />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search" />
      <AdminTable
        rows={slice}
        empty={empty}
        columns={[
          ...columns,
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
              <RowActions
                onEdit={() => { setEditing(row._id); setForm({ ...emptyForm, ...row }); setOpen(true); }}
                onDelete={() => setRemove(row)}
              />
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? `Edit ${title.toLowerCase()}` : createLabel} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          {fields({ form, setForm })}
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title={`Delete ${title.toLowerCase()}`}
        body="This cannot be undone."
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`${endpoint}/${remove._id}`);
          setRemove(null);
          toast('Deleted.');
          load();
        }}
      />
    </div>
  );
}

export { fieldClass, labelClass };
