import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

const TABS = [
  { id: 'purposes', label: 'Purposes' },
  { id: 'intentions', label: 'Intentions' },
  { id: 'mappings', label: 'Bead mappings' },
];

export default function AdminIntentions() {
  const [tab, setTab] = useState('purposes');
  const [purposes, setPurposes] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [beads, setBeads] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [pForm, setPForm] = useState({ name: '', description: '' });
  const [iForm, setIForm] = useState({ name: '', purposeId: '', description: '' });
  const [mForm, setMForm] = useState({ intentionId: '', beadId: '', reason: '' });
  const [editing, setEditing] = useState(null);

  async function load() {
    const [p, i, b, m] = await Promise.all([
      api.get('/customizer/admin/purposes'),
      api.get('/customizer/admin/intentions'),
      api.get('/customizer/admin/beads'),
      api.get('/customizer/admin/mappings'),
    ]);
    setPurposes(p.data.purposes || []);
    setIntentions(i.data.intentions || []);
    setBeads(b.data.beads || []);
    setMappings(m.data.mappings || []);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setPForm({ name: '', description: '' });
    setIForm({ name: '', purposeId: '', description: '' });
    setMForm({ intentionId: '', beadId: '', reason: '' });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (tab === 'purposes') {
      if (editing) await api.put(`/customizer/admin/purposes/${editing}`, pForm);
      else await api.post('/customizer/admin/purposes', { ...pForm, sortOrder: purposes.length + 1 });
    } else if (tab === 'intentions') {
      if (editing) await api.put(`/customizer/admin/intentions/${editing}`, iForm);
      else await api.post('/customizer/admin/intentions', iForm);
    } else {
      if (editing) await api.put(`/customizer/admin/mappings/${editing}`, mForm);
      else await api.post('/customizer/admin/mappings', mForm);
    }
    setOpen(false);
    setEditing(null);
    load();
  }

  async function confirmRemove() {
    if (tab === 'purposes') await api.delete(`/customizer/admin/purposes/${remove._id}`);
    else if (tab === 'intentions') await api.delete(`/customizer/admin/intentions/${remove._id}`);
    else await api.delete(`/customizer/admin/mappings/${remove._id}`);
    setRemove(null);
    load();
  }

  const createLabel = tab === 'purposes' ? 'Create purpose' : tab === 'intentions' ? 'Create intention' : 'Create mapping';

  return (
    <div>
      <AdminHeader
        title="Purposes & mappings"
        subtitle="Keep purpose → intention → bead as data. Recommendation copy is required."
        onCreate={openCreate}
        createLabel={createLabel}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest ${tab === t.id ? 'bg-amethyst text-ivory' : 'border border-gold/30 text-lilac'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'purposes' && (
        <AdminTable
          rows={purposes}
          columns={[
            { key: 'name', label: 'Purpose', render: (p) => <span className="font-medium">{p.name}</span> },
            { key: 'description', label: 'Description', render: (p) => <span className="text-lilac">{p.description}</span> },
            { key: 'sortOrder', label: 'Sort' },
            { key: 'isActive', label: 'Status', render: (p) => p.isActive ? 'Active' : 'Hidden' },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (p) => (
                <RowActions
                  onEdit={() => { setEditing(p._id); setPForm({ name: p.name, description: p.description || '' }); setOpen(true); }}
                  onDelete={() => setRemove(p)}
                />
              ),
            },
          ]}
        />
      )}

      {tab === 'intentions' && (
        <AdminTable
          rows={intentions}
          columns={[
            { key: 'purpose', label: 'Purpose', render: (i) => i.purposeId?.name || '—' },
            { key: 'name', label: 'Intention' },
            { key: 'description', label: 'Description', render: (i) => <span className="line-clamp-2 text-lilac">{i.description}</span> },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (i) => (
                <RowActions
                  onEdit={() => {
                    setEditing(i._id);
                    setIForm({ name: i.name, purposeId: i.purposeId?._id || i.purposeId, description: i.description || '' });
                    setOpen(true);
                  }}
                  onDelete={() => setRemove(i)}
                />
              ),
            },
          ]}
        />
      )}

      {tab === 'mappings' && (
        <AdminTable
          rows={mappings}
          columns={[
            { key: 'intention', label: 'Intention', render: (m) => m.intentionId?.name || '—' },
            { key: 'bead', label: 'Bead', render: (m) => m.beadId?.name || '—' },
            { key: 'reason', label: 'Why recommended', render: (m) => <span className="line-clamp-2 text-lilac">{m.reason}</span> },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (m) => (
                <RowActions
                  onEdit={() => {
                    setEditing(m._id);
                    setMForm({
                      intentionId: m.intentionId?._id || m.intentionId,
                      beadId: m.beadId?._id || m.beadId,
                      reason: m.reason,
                    });
                    setOpen(true);
                  }}
                  onDelete={() => setRemove(m)}
                />
              ),
            },
          ]}
        />
      )}

      <AdminDrawer open={open} title={editing ? `Edit ${tab.slice(0, -1)}` : createLabel} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          {tab === 'purposes' && (
            <>
              <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} /></label>
              <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} /></label>
            </>
          )}
          {tab === 'intentions' && (
            <>
              <label className={labelClass}>Purpose
                <select required className={`${fieldClass} mt-1`} value={iForm.purposeId} onChange={(e) => setIForm({ ...iForm, purposeId: e.target.value })}>
                  <option value="">Select</option>
                  {purposes.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={iForm.name} onChange={(e) => setIForm({ ...iForm, name: e.target.value })} /></label>
              <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={iForm.description} onChange={(e) => setIForm({ ...iForm, description: e.target.value })} /></label>
            </>
          )}
          {tab === 'mappings' && (
            <>
              <label className={labelClass}>Intention
                <select required className={`${fieldClass} mt-1`} value={mForm.intentionId} onChange={(e) => setMForm({ ...mForm, intentionId: e.target.value })}>
                  <option value="">Select</option>
                  {intentions.map((i) => <option key={i._id} value={i._id}>{i.purposeId?.name ? `${i.purposeId.name} · ` : ''}{i.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>Bead
                <select required className={`${fieldClass} mt-1`} value={mForm.beadId} onChange={(e) => setMForm({ ...mForm, beadId: e.target.value })}>
                  <option value="">Select</option>
                  {beads.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>Why this bead<textarea required className={`${fieldClass} mt-1`} value={mForm.reason} onChange={(e) => setMForm({ ...mForm, reason: e.target.value })} /></label>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete record"
        body={remove ? `Remove “${remove.name || remove.reason || 'this record'}”?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
