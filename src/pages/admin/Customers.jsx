import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'repeat', label: 'Repeat' },
  { id: 'vip', label: 'VIP' },
  { id: 'inactive', label: 'Inactive' },
];

export default function AdminCustomers() {
  const [params, setParams] = useSearchParams();
  const group = params.get('group') || 'all';
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupIds, setGroupIds] = useState([]);

  const load = () => {
    const qs = new URLSearchParams({ group });
    if (q) qs.set('q', q);
    api.get(`/admin/customers?${qs}`).then(({ data }) => setCustomers(data.customers || []));
  };
  useEffect(() => { load(); }, [group, q]);
  useEffect(() => { api.get('/admin/groups').then(({ data }) => setGroups(data.items || [])); }, []);
  useEffect(() => { setPage(1); }, [group, q]);

  const { slice, total, pages, page: p } = paginate(customers, page);

  return (
    <div>
      <AdminHeader title="Customers" subtitle="New in the last 30 days. Repeat = more than one order. VIP = ₹5,000+ spent." />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Name, email, phone"
        filters={
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setParams(g.id === 'all' ? {} : { group: g.id })}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-widest ${group === g.id ? 'border-gold bg-gold/15 text-gold' : 'border-gold/30 text-lilac'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        }
      />
      <AdminTable
        rows={slice}
        empty="No customers in this group."
        columns={[
          { key: 'name', label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone', render: (u) => u.phone || '—' },
          { key: 'orders', label: 'Orders' },
          { key: 'spent', label: 'Spent', render: (u) => <Price value={u.spent} /> },
          { key: 'aov', label: 'AOV', render: (u) => <Price value={u.aov} /> },
          { key: 'segment', label: 'Group', render: (u) => <span className="text-[10px] uppercase tracking-widest text-gold">{u.segment}</span> },
          { key: 'createdAt', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString('en-IN') },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (u) => (
              <RowActions onEdit={async () => {
                setEditing(u);
                setRole(u.role);
                setName(u.name);
                setPhone(u.phone || '');
                setGroupIds((u.groupIds || []).map((g) => g._id || g));
                try {
                  const { data } = await api.get(`/admin/customers/${u._id}`);
                  setProfile(data);
                } catch {
                  setProfile(null);
                }
              }} />
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={!!editing} title={editing ? editing.name : 'Customer'} onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put(`/admin/users/${editing._id}`, { role, name, phone });
                await api.put(`/admin/customers/${editing._id}/groups`, { groupIds });
                toast('Customer saved.');
                setEditing(null);
                load();
              } catch (err) {
                toast(err.message || 'Could not save.', 'error');
              }
            }}
          >
            <p className="text-sm text-lilac">{editing.email}</p>
            <p className="text-sm text-lilac">{profile?.customer?.orders ?? editing.orders} orders · <Price value={profile?.customer?.spent ?? editing.spent} /> · AOV <Price value={profile?.customer?.aov ?? editing.aov} /></p>
            {!!profile?.topProducts?.length && (
              <p className="text-xs text-lilac">Most purchased: {profile.topProducts.map((p) => `${p.name} ×${p.qty}`).join(', ')}</p>
            )}
            {!!profile?.couponsUsed?.length && (
              <p className="text-xs text-lilac">Coupons: {profile.couponsUsed.map((c) => c.code).join(', ')}</p>
            )}
            {(profile?.customer?.addresses || editing.addresses || []).length > 0 && (
              <p className="text-xs text-lilac">
                Addresses: {(profile?.customer?.addresses || editing.addresses).map((a) => `${a.line1}, ${a.city}`).join(' · ')}
              </p>
            )}
            {!!groups.length && (
              <label className={labelClass}>Groups
                <select multiple className={`${fieldClass} mt-1 h-24`} value={groupIds} onChange={(e) => setGroupIds([...e.target.selectedOptions].map((o) => o.value))}>
                  {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </label>
            )}
            <label className={labelClass}>Name<input className={`${fieldClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className={labelClass}>Phone<input className={`${fieldClass} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className={labelClass}>Role
              <select className={`${fieldClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">customer</option>
                <option value="staff">staff</option>
                <option value="manager">manager</option>
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
