import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

const empty = {
  name: '', shortDescriptor: '', powerUse: '', benefits: '', chakra: '', careNotes: '',
  pricePerBead: 0, stock: 100, colorHex: '#C6A75E', isActive: true, image: '',
};

export default function AdminBeads() {
  const [beads, setBeads] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);

  const load = () => api.get('/customizer/admin/beads').then(({ data }) => setBeads(data.beads || []));
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(b) {
    setEditing(b._id);
    setForm({ ...empty, ...b, benefits: (b.benefits || []).join('\n') });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, pricePerBead: Number(form.pricePerBead), stock: Number(form.stock) };
    if (editing) await api.put(`/customizer/admin/beads/${editing}`, payload);
    else await api.post('/customizer/admin/beads', payload);
    setOpen(false);
    setForm(empty);
    setEditing(null);
    load();
  }

  return (
    <div>
      <AdminHeader title="Beads" subtitle="Per-bead prices live here. The storefront never hard-codes them." onCreate={openCreate} createLabel="Create bead" />
      <AdminTable
        rows={beads}
        columns={[
          {
            key: 'item',
            label: 'Bead',
            render: (b) => (
              <div className="flex items-center gap-3">
                {b.image ? <img src={b.image} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="h-11 w-11 rounded-full" style={{ background: b.colorHex }} />}
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-lilac">{b.shortDescriptor}</div>
                </div>
              </div>
            ),
          },
          { key: 'pricePerBead', label: 'Price / bead', render: (b) => <Price value={b.pricePerBead} /> },
          { key: 'chakra', label: 'Chakra', render: (b) => b.chakra || '—' },
          { key: 'stock', label: 'Stock' },
          { key: 'isActive', label: 'Status', render: (b) => b.isActive ? 'Active' : 'Hidden' },
          { key: 'actions', label: 'Actions', align: 'right', render: (b) => <RowActions onEdit={() => openEdit(b)} onDelete={() => setRemove(b)} /> },
        ]}
      />
      <AdminDrawer open={open} title={editing ? 'Edit bead' : 'Create bead'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Short descriptor<input className={`${fieldClass} mt-1`} value={form.shortDescriptor} onChange={(e) => setForm({ ...form, shortDescriptor: e.target.value })} /></label>
          <label className={labelClass}>Price per bead<input type="number" className={`${fieldClass} mt-1`} value={form.pricePerBead} onChange={(e) => setForm({ ...form, pricePerBead: e.target.value })} /></label>
          <label className={labelClass}>Image URL<input className={`${fieldClass} mt-1`} value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
          <label className={labelClass}>Color hex<input className={`${fieldClass} mt-1`} value={form.colorHex} onChange={(e) => setForm({ ...form, colorHex: e.target.value })} /></label>
          <label className={labelClass}>Chakra<input className={`${fieldClass} mt-1`} value={form.chakra} onChange={(e) => setForm({ ...form, chakra: e.target.value })} /></label>
          <label className={labelClass}>Stock<input type="number" className={`${fieldClass} mt-1`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
          <label className={labelClass}>Power / use<textarea className={`${fieldClass} mt-1`} value={form.powerUse} onChange={(e) => setForm({ ...form, powerUse: e.target.value })} /></label>
          <label className={labelClass}>Benefits (one per line)<textarea className={`${fieldClass} mt-1`} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></label>
          <label className={labelClass}>Care notes<textarea className={`${fieldClass} mt-1`} value={form.careNotes} onChange={(e) => setForm({ ...form, careNotes: e.target.value })} /></label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete bead"
        body={remove ? `Remove “${remove.name}” from the customizer?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/customizer/admin/beads/${remove._id}`);
          setRemove(null);
          load();
        }}
      />
    </div>
  );
}
