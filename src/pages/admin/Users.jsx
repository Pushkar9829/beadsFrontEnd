import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { FilterSelect, paginate, Pagination } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState('customer');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('admin');
  const [page, setPage] = useState(1);
  const load = () => api.get('/admin/users').then(({ data }) => setUsers(data.users || []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const hay = `${u.name} ${u.email}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [users, q, roleFilter]);
  const { slice, total, pages, page: p } = paginate(filtered, page);

  return (
    <div>
      <AdminHeader title="Admin users" subtitle="Promote carefully. Storefront logins use the same accounts." />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Name or email"
        filters={
          <FilterSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[{ value: 'admin', label: 'Admins' }, { value: 'customer', label: 'Customers' }, { value: 'all', label: 'Everyone' }]}
          />
        }
      />
      <AdminTable
        rows={slice}
        empty="No users in this filter."
        columns={[
          { key: 'name', label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone', render: (u) => u.phone || '—' },
          { key: 'role', label: 'Role' },
          { key: 'createdAt', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString('en-IN') },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (u) => <RowActions onEdit={() => { setEditing(u); setRole(u.role); }} />,
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={!!editing} title={editing ? `Edit ${editing.name}` : 'User'} onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put(`/admin/users/${editing._id}`, { role });
                toast('User saved.');
                setEditing(null);
                load();
              } catch (err) {
                toast(err.message || 'Could not save user.', 'error');
              }
            }}
          >
            <p className="text-sm text-lilac">{editing.email}</p>
            <label className={labelClass}>Role
              <select className={`${fieldClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>
    </div>
  );
}

