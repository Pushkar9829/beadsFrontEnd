import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

const STATUSES = ['pending_payment', 'paid', 'packed', 'shipped', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const load = () => api.get('/orders/admin/all').then(({ data }) => setOrders(data.orders || []));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <AdminHeader title="Orders" subtitle="Pending-payment orders wait for the gateway in a later phase." />
      <AdminTable
        rows={orders}
        empty="No orders yet."
        columns={[
          { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
          { key: 'customer', label: 'Customer', render: (o) => <span>{o.contactName}<div className="text-xs text-lilac">{o.email}</div></span> },
          { key: 'total', label: 'Total', render: (o) => <Price value={o.total} /> },
          { key: 'status', label: 'Status', render: (o) => o.status.replace('_', ' ') },
          { key: 'createdAt', label: 'Placed', render: (o) => new Date(o.createdAt).toLocaleString('en-IN') },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (o) => <RowActions onEdit={() => { setEditing(o); setStatus(o.status); }} />,
          },
        ]}
      />
      <AdminDrawer open={!!editing} title={editing ? `Order ${editing.orderNumber}` : 'Order'} onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.put(`/orders/admin/${editing._id}`, { status });
              setEditing(null);
              load();
            }}
          >
            <p className="text-sm text-lilac">{editing.contactName} · {editing.email}</p>
            <p className="text-sm text-lilac">
              {editing.shippingAddress?.line1}, {editing.shippingAddress?.city} {editing.shippingAddress?.pincode}
            </p>
            <p className="text-gold"><Price value={editing.total} /></p>
            <label className={labelClass}>Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
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
