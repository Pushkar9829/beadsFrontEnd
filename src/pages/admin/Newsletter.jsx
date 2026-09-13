import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Pagination, paginate } from '../../components/admin/AdminToolbar';
import Button from '../../components/ui/Button';

export default function AdminNewsletter() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    api.get('/admin/newsletter').then(({ data }) => setRows(data.subscribers || []));
  }, []);
  const { slice, total, pages, page: p } = paginate(rows, page);

  function exportCsv() {
    api.get('/admin/newsletter/export', { responseType: 'blob' }).then(({ data }) => {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div>
      <AdminHeader title="Newsletter" subtitle="Storefront subscribers." />
      <div className="mb-4"><Button onClick={exportCsv}>Export CSV</Button></div>
      <AdminTable
        rows={slice}
        empty="No subscribers yet."
        columns={[
          { key: 'email', label: 'Email', render: (r) => <span className="font-medium">{r.email}</span> },
          { key: 'name', label: 'Name', render: (r) => r.name || '—' },
          { key: 'source', label: 'Source' },
          { key: 'createdAt', label: 'Joined', render: (r) => new Date(r.createdAt).toLocaleString('en-IN') },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
