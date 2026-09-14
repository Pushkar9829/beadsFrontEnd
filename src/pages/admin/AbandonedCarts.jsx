import { useEffect, useState } from 'react';
import api from '../../api/client';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Pagination, paginate } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [page, setPage] = useState(1);
  const load = () => api.get('/admin/abandoned-carts').then(({ data }) => setCarts(data.carts || []));
  useEffect(() => { load(); }, []);
  const { slice, total, pages, page: p } = paginate(carts, page);

  return (
    <div>
      <AdminHeader title="Abandoned carts" subtitle="Carts idle for more than an hour. Remind creates an admin notification — it does not email the customer." />
      <AdminTable
        rows={slice}
        empty="No abandoned carts."
        columns={[
          { key: 'user', label: 'Customer', render: (c) => c.user ? <span>{c.user.name}<div className="text-xs text-lilac">{c.user.email}</div></span> : 'Guest / unknown' },
          { key: 'items', label: 'Items' },
          { key: 'total', label: 'Value', render: (c) => <Price value={c.total} /> },
          { key: 'updatedAt', label: 'Last activity', render: (c) => new Date(c.updatedAt).toLocaleString('en-IN') },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (c) => (
              <button
                type="button"
                className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold"
                onClick={async () => {
                  try {
                    await api.post(`/admin/abandoned-carts/${c._id}/remind`);
                    toast('Reminder queued.');
                    load();
                  } catch (err) {
                    toast(err.message || 'Could not send reminder.', 'error');
                  }
                }}
              >
                {c.remindedAt ? 'Remind again' : 'Remind'}
              </button>
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
