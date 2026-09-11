import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const STATUSES = ['pending_payment', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PROCESSING = ['paid', 'processing', 'packed'];

const TITLES = {
  pending_payment: ['Pending orders', 'Awaiting payment.'],
  processing: ['Processing', 'Paid, packing, or in the workroom.'],
  shipped: ['Shipped', 'On the way.'],
  delivered: ['Delivered', 'Completed deliveries.'],
  cancelled: ['Cancelled', 'Stopped before delivery.'],
  returned: ['Returns', 'Returned after delivery.'],
};

export default function AdminOrders() {
  const { tab } = useParams();
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [carrier, setCarrier] = useState('');
  const [waybill, setWaybill] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tab && tab !== 'processing') params.set('status', tab);
    api.get(`/orders/admin/all?${params}`).then(({ data }) => {
      setOrders(data.orders || []);
      setStatusCounts(data.statusCounts || {});
    });
  };
  useEffect(() => { load(); }, [tab, q]);
  useEffect(() => { setPage(1); }, [tab, q]);

  const rows = useMemo(() => {
    if (tab === 'processing') return orders.filter((o) => PROCESSING.includes(o.status));
    return orders;
  }, [orders, tab]);
  const { slice, total, pages, page: p } = paginate(rows, page);
  const meta = TITLES[tab] || ['Orders', 'Search, filter, and move each order through fulfilment.'];

  return (
    <div>
      <AdminHeader title={meta[0]} subtitle={`${meta[1]} ${statusCounts.all != null ? `${statusCounts.all} total.` : ''}`} />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Order no., name, email, phone" />
      <AdminTable
        rows={slice}
        empty="No orders in this view."
        columns={[
          { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
          { key: 'customer', label: 'Customer', render: (o) => <span>{o.contactName}<div className="text-xs text-lilac">{o.email}</div></span> },
          { key: 'items', label: 'Items', render: (o) => o.items?.length || 0 },
          { key: 'total', label: 'Total', render: (o) => <Price value={o.total} /> },
          { key: 'status', label: 'Status', render: (o) => <StatusBadge kind="order" value={o.status} /> },
          { key: 'createdAt', label: 'Placed', render: (o) => new Date(o.createdAt).toLocaleString('en-IN') },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (o) => (
              <RowActions onEdit={() => {
                setEditing(o);
                setStatus(o.status);
                setNotes(o.notes || '');
                setCarrier(o.shipment?.carrier || '');
                setWaybill(o.shipment?.waybill || '');
              }} />
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={!!editing} title={editing ? `Order ${editing.orderNumber}` : 'Order'} onClose={() => setEditing(null)} wide>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put(`/orders/admin/${editing._id}`, { status, notes, carrier, waybill });
                toast('Order updated.');
                setEditing(null);
                load();
              } catch (err) {
                toast(err.message || 'Could not update order.', 'error');
              }
            }}
          >
            <p className="text-sm text-lilac">{editing.contactName} · {editing.email} · {editing.phone || 'no phone'}</p>
            <p className="text-sm text-lilac">
              {editing.shippingAddress?.line1}, {editing.shippingAddress?.city} {editing.shippingAddress?.pincode}
            </p>
            <p className="text-gold"><Price value={editing.total} /></p>
            <ul className="space-y-1 text-sm text-lilac">
              {(editing.items || []).map((item, i) => (
                <li key={i}>{(item.snapshot?.name || item.name || item.kind)} × {item.quantity}</li>
              ))}
            </ul>
            <label className={labelClass}>Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className={labelClass}>Carrier<input className={`${fieldClass} mt-1`} value={carrier} onChange={(e) => setCarrier(e.target.value)} /></label>
            <label className={labelClass}>Waybill / tracking<input className={`${fieldClass} mt-1`} value={waybill} onChange={(e) => setWaybill(e.target.value)} /></label>
            <label className={labelClass}>Internal notes<textarea className={`${fieldClass} mt-1`} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            {(editing.timeline || []).length > 0 && (
              <div>
                <p className={labelClass}>Timeline</p>
                <ul className="mt-2 space-y-1 text-xs text-lilac">
                  {editing.timeline.map((t, i) => (
                    <li key={i}>{new Date(t.at).toLocaleString('en-IN')} · {t.status}{t.note ? ` — ${t.note}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
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
