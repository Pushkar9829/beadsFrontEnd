import { useEffect, useState } from 'react';
import api from '../../api/client';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Pagination, paginate } from '../../components/admin/AdminToolbar';

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    api.get('/admin/abandoned-carts').then(({ data }) => setCarts(data.carts || []));
  }, []);
  const { slice, total, pages, page: p } = paginate(carts, page);

  return (
    <div>
      <AdminHeader title="Abandoned carts" subtitle="Carts with items that have sat idle for more than an hour." />
      <AdminTable
        rows={slice}
        empty="No abandoned carts."
        columns={[
          { key: 'user', label: 'Customer', render: (c) => c.user ? <span>{c.user.name}<div className="text-xs text-lilac">{c.user.email}</div></span> : 'Guest / unknown' },
          { key: 'items', label: 'Items' },
          { key: 'total', label: 'Value', render: (c) => <Price value={c.total} /> },
          { key: 'updatedAt', label: 'Last activity', render: (c) => new Date(c.updatedAt).toLocaleString('en-IN') },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
