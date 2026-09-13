import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { fieldClass, labelClass } from '../../components/admin/AdminHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

const STEPS = ['requested', 'approved', 'rejected', 'refunded', 'restocked'];

export default function AdminReturns() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('requested');
  const [note, setNote] = useState('');
  const [pickupBusy, setPickupBusy] = useState(false);

  const load = () => api.get('/admin/returns').then(({ data }) => setRows(data.returns || []));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <AdminHeader title="Returns / refunds" subtitle="Approve, refund, and restock. Refunded orders move to Returned." />
      <AdminTable
        rows={rows}
        empty="No return requests."
        columns={[
          { key: 'order', label: 'Order', render: (r) => r.orderId?.orderNumber || '—' },
          { key: 'customer', label: 'Customer', render: (r) => r.orderId?.contactName || r.userId?.name || '—' },
          { key: 'type', label: 'Type', render: (r) => r.type || 'return' },
          { key: 'reason', label: 'Reason' },
          { key: 'pickup', label: 'Pickup', render: (r) => r.shipment?.waybill || '—' },
          { key: 'refundAmount', label: 'Refund', render: (r) => <Price value={r.refundAmount} /> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge kind="order" value={r.status} /> },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (r) => (
              <button type="button" className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold" onClick={() => { setEditing(r); setStatus(r.status); setNote(r.adminNote || ''); }}>
                Review
              </button>
            ),
          },
        ]}
      />
      <AdminDrawer open={!!editing} title="Return" onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put(`/admin/returns/${editing._id}`, { status, adminNote: note });
                toast('Return updated.');
                setEditing(null);
                load();
              } catch (err) {
                toast(err.message || 'Could not update.', 'error');
              }
            }}
          >
            <p className="text-sm text-lilac">{editing.type || 'return'} · {editing.reason}</p>
            {editing.type === 'exchange' && (
              <p className="text-xs text-lilac">After the reverse pickup is received, book a replacement from the order with iThink.</p>
            )}
            {editing.shipment?.waybill && (
              <p className="text-xs text-lilac">
                Reverse AWB {editing.shipment.waybill}
                {editing.shipment.trackingUrl ? (
                  <> · <a href={editing.shipment.trackingUrl} className="text-gold" target="_blank" rel="noreferrer">Track</a></>
                ) : null}
              </p>
            )}
            <label className={labelClass}>Status
              <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className={labelClass}>Note<textarea className={`${fieldClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit">Save</Button>
              {editing.status === 'approved' && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pickupBusy}
                  onClick={async () => {
                    setPickupBusy(true);
                    try {
                      const { data } = await api.post(`/admin/returns/${editing._id}/pickup`, { force: Boolean(editing.shipment?.waybill) });
                      setEditing(data.return);
                      toast('Reverse pickup booked.');
                      load();
                    } catch (err) {
                      toast(err.message || 'Could not book pickup.', 'error');
                    } finally {
                      setPickupBusy(false);
                    }
                  }}
                >
                  {pickupBusy ? 'Booking…' : editing.shipment?.waybill ? 'Rebook pickup' : 'Book reverse pickup'}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>
    </div>
  );
}
