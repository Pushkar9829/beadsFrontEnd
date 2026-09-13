import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Pagination, paginate } from '../../components/admin/AdminToolbar';
import Button from '../../components/ui/Button';
import { toast } from '../../lib/adminToast';

export default function AdminNotifications() {
  const [rows, setRows] = useState([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);

  const load = () => api.get('/admin/notifications').then(({ data }) => {
    setRows(data.notifications || []);
    setUnread(data.unread || 0);
  });
  useEffect(() => { load(); }, []);
  const { slice, total, pages, page: p } = paginate(rows, page);

  return (
    <div>
      <AdminHeader title="Notifications" subtitle={`${unread} unread. New orders, stock, payments, and customers land here.`} />
      <div className="mb-4">
        <Button
          onClick={async () => {
            await api.post('/admin/notifications/read-all');
            toast('All marked read.');
            load();
          }}
        >
          Mark all read
        </Button>
      </div>
      <AdminTable
        rows={slice}
        empty="No notifications."
        columns={[
          { key: 'title', label: 'Alert', render: (n) => (
            <span className={n.read ? 'text-lilac' : 'font-medium text-ivory'}>{n.title}</span>
          ) },
          { key: 'type', label: 'Type' },
          { key: 'body', label: 'Detail', render: (n) => n.body || '—' },
          { key: 'createdAt', label: 'When', render: (n) => new Date(n.createdAt).toLocaleString('en-IN') },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (n) => (
              <div className="flex justify-end gap-2">
                {n.link && <Link to={n.link} className="text-xs uppercase tracking-widest text-gold">Open</Link>}
                {!n.read && (
                  <button type="button" className="text-xs uppercase tracking-widest text-lilac" onClick={async () => {
                    await api.post(`/admin/notifications/${n._id}/read`);
                    load();
                  }}>Read</button>
                )}
              </div>
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
