import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState('customer');
  const load = () => api.get('/admin/users').then(({ data }) => setUsers(data.users || []));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <AdminHeader title="Users" subtitle="Same login as the website. Promote carefully." />
      <AdminTable
        rows={users}
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
      <AdminDrawer open={!!editing} title={editing ? `Edit ${editing.name}` : 'User'} onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.put(`/admin/users/${editing._id}`, { role });
              setEditing(null);
              load();
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
