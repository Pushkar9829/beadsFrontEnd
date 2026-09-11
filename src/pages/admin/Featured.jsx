import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

export default function AdminFeatured() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.get('/products/admin/all').then(({ data }) => setProducts(data.products || []));
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const { slice, total, pages, page: p } = paginate(filtered, page);

  async function toggle(product) {
    try {
      await api.put(`/products/admin/${product._id}`, { featured: !product.featured });
      toast(product.featured ? 'Removed from featured.' : 'Marked featured.');
      load();
    } catch (err) {
      toast(err.message || 'Could not update.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Featured products" subtitle="What the storefront highlights on home and shop." />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search products" />
      <AdminTable
        rows={slice}
        empty="No products yet."
        columns={[
          {
            key: 'item',
            label: 'Product',
            render: (row) => (
              <div className="flex items-center gap-3">
                {row.images?.[0] ? <img src={mediaUrl(row.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-raised" />}
                <span className="font-medium">{row.name}</span>
              </div>
            ),
          },
          { key: 'price', label: 'Price', render: (row) => <Price value={row.price} /> },
          { key: 'featured', label: 'Featured', render: (row) => row.featured ? 'Yes' : '—' },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
              <button type="button" onClick={() => toggle(row)} className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10">
                {row.featured ? 'Unfeature' : 'Feature'}
              </button>
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
    </div>
  );
}
