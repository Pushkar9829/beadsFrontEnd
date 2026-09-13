import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Pagination, paginate } from '../../components/admin/AdminToolbar';

export default function AdminContacts() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    api.get('/admin/contacts').then(({ data }) => setRows(data.messages || []));
  }, []);
  const { slice, total, pages, page: p } = paginate(rows, page);
  return (
    <div>
      <AdminHeader title="Contact messages" subtitle="Notes sent from the storefront contact drawer." />
      <AdminTable
        rows={slice}
        empty="No messages."
        columns={[
          { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
          { key: 'message', label: 'Message' },
          { key: 'createdAt', label: 'When', render: (r) => new Date(r.createdAt).toLocaleString('en-IN') },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
