import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination, FilterSelect } from '../../components/admin/AdminToolbar';
import StatusBadge from '../../components/admin/StatusBadge';
import { toast } from '../../lib/adminToast';

export default function AdminInventory() {
  const { pathname } = useLocation();
  const isHistory = pathname.endsWith('/history');
  const view = pathname.endsWith('/low') ? 'low' : 'all';
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [adjust, setAdjust] = useState(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('restock');
  const [statusFilter, setStatusFilter] = useState('all');

  function load() {
    if (isHistory) {
      api.get('/admin/inventory/history').then(({ data }) => setHistory(data.history || []));
    } else {
      api.get(`/admin/inventory?view=${view}&q=${encodeURIComponent(q)}`).then(({ data }) => setProducts(data.products || []));
    }
  }
  useEffect(() => { load(); }, [view, isHistory, q]);
  useEffect(() => { setPage(1); }, [q, view, isHistory, statusFilter]);

  const shown = view === 'low' || statusFilter === 'all' ? products : products.filter((p) => p.stockStatus === statusFilter);
  const { slice, total, pages, page: p } = paginate(isHistory ? history : shown, page);

  async function saveAdjust(e) {
    e.preventDefault();
    try {
      await api.post('/admin/inventory/adjust', {
        productId: adjust._id,
        delta: Number(delta),
        reason,
      });
      toast('Stock updated.');
      setAdjust(null);
      setDelta('');
      load();
    } catch (err) {
      toast(err.message || 'Could not adjust stock.', 'error');
    }
  }

  if (isHistory) {
    return (
      <div>
        <AdminHeader title="Stock history" subtitle="Every increase and decrease, with a reason." />
        <AdminTable
          rows={slice}
          empty="No adjustments yet."
          columns={[
            { key: 'product', label: 'Product', render: (h) => h.productId?.name || '—' },
            { key: 'delta', label: 'Change', render: (h) => <span className={h.delta > 0 ? 'text-emerald-300' : 'text-red-300'}>{h.delta > 0 ? `+${h.delta}` : h.delta}</span> },
            { key: 'previousStock', label: 'From' },
            { key: 'nextStock', label: 'To' },
            { key: 'reason', label: 'Reason' },
            { key: 'user', label: 'By', render: (h) => h.userId?.name || h.userId?.email || '—' },
            { key: 'createdAt', label: 'When', render: (h) => new Date(h.createdAt).toLocaleString('en-IN') },
          ]}
        />
        <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title={view === 'low' ? 'Low stock' : 'Inventory'}
        subtitle={view === 'low' ? 'At or below each product’s low-stock limit.' : 'Adjust stock with a reason. History is kept.'}
      />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search name or SKU"
        filters={view === 'low' ? null : (
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All stock' },
              { value: 'ok', label: 'In stock' },
              { value: 'low', label: 'Low' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />
        )}
      />
      <AdminTable
        rows={slice}
        empty={view === 'low' ? 'No low-stock products.' : 'No products in inventory.'}
        columns={[
          { key: 'name', label: 'Product', render: (p) => <span className="font-medium">{p.name}<div className="text-xs text-lilac">{p.sku || 'No SKU'}</div></span> },
          { key: 'category', label: 'Category', render: (p) => p.categoryId?.name || '—' },
          { key: 'stock', label: 'Stock' },
          { key: 'lowStockLimit', label: 'Alert at' },
          { key: 'status', label: 'Status', render: (p) => <StatusBadge kind="stock" value={p.stockStatus} /> },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (p) => (
              <button type="button" onClick={() => { setAdjust(p); setDelta(''); setReason('restock'); }} className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10">
                Adjust
              </button>
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={!!adjust} title={adjust ? `Adjust ${adjust.name}` : 'Adjust'} onClose={() => setAdjust(null)}>
        {adjust && (
          <form onSubmit={saveAdjust} className="space-y-3">
            <p className="text-sm text-lilac">Current stock: {adjust.stock}</p>
            <label className={labelClass}>Quantity change
              <input required type="number" className={`${fieldClass} mt-1`} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+10 or -3" />
            </label>
            <label className={labelClass}>Reason
              <select className={`${fieldClass} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="restock">Restock</option>
                <option value="correction">Correction</option>
                <option value="damage">Damage / loss</option>
                <option value="return">Customer return</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Apply</Button>
              <Button variant="ghost" onClick={() => setAdjust(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>
    </div>
  );
}
