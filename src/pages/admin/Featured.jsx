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

  const load = () => api.get('/admin/featured').then(({ data }) => setProducts(data.products || []));
  useEffect(() => { load(); }, []);

  const featured = products.filter((p) => p.featured).sort((a, b) => (a.featuredSort || 0) - (b.featuredSort || 0));
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const { slice, total, pages, page: p } = paginate(filtered, page);

  async function toggle(product) {
    try {
      await api.put(`/admin/featured/${product._id}`, { featured: !product.featured });
      toast(product.featured ? 'Removed from featured.' : 'Marked featured.');
      load();
    } catch (err) {
      toast(err.message || 'Could not update.', 'error');
    }
  }

  async function move(index, dir) {
    const next = [...featured];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try {
      await api.put('/admin/featured/reorder', { ids: next.map((item) => item._id) });
      toast('Featured order saved.');
      load();
    } catch (err) {
      toast(err.message || 'Could not reorder.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Featured products" subtitle="A dedicated flag and sort order for the home featured rail." />
      {featured.length > 0 && (
        <div className="mb-8 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gold">On the homepage</p>
          {featured.map((row, i) => (
            <div key={row._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/20 bg-surface px-4 py-3">
              <div className="flex gap-1">
                <button type="button" className="text-gold disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="text-gold disabled:opacity-30" disabled={i === featured.length - 1} onClick={() => move(i, 1)}>↓</button>
              </div>
              {row.images?.[0] ? <img src={mediaUrl(row.images[0])} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-raised" />}
              <div className="min-w-0 flex-1 font-medium">{row.name}</div>
              <Price value={row.price} />
              <button type="button" onClick={() => toggle(row)} className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10">
                Unfeature
              </button>
            </div>
          ))}
        </div>
      )}
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
          { key: 'featured', label: 'Featured', render: (row) => (row.featured ? 'Yes' : '—') },
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
