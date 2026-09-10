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
  { id: 'mulank', label: 'Mulank crystals' },
  { id: 'zodiac', label: 'Zodiac beads' },
];

export default function AdminIntentions() {
  const [tab, setTab] = useState('purposes');
  const [purposes, setPurposes] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [beads, setBeads] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [mulank, setMulank] = useState([]);
  const [zodiac, setZodiac] = useState([]);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [pForm, setPForm] = useState({ name: '', description: '' });
  const [iForm, setIForm] = useState({ name: '', purposeId: '', description: '' });
  const [mForm, setMForm] = useState({ intentionId: '', beadId: '', reason: '' });
  const [nForm, setNForm] = useState({ number: 1, beadId: '', reason: '' });
  const [zForm, setZForm] = useState({ sign: '', fromMonth: 1, fromDay: 1, toMonth: 1, toDay: 1, beadId: '', reason: '' });
  const [editing, setEditing] = useState(null);

  async function load() {
    const [p, i, b, m, n, z] = await Promise.all([
      api.get('/customizer/admin/purposes'),
      api.get('/customizer/admin/intentions'),
      api.get('/customizer/admin/beads'),
      api.get('/customizer/admin/mappings'),
      api.get('/customizer/admin/mulank').catch(() => ({ data: { mappings: [] } })),
      api.get('/customizer/admin/zodiac').catch(() => ({ data: { mappings: [] } })),
    ]);
    setPurposes(p.data.purposes || []);
    setIntentions(i.data.intentions || []);
    setBeads(b.data.beads || []);
    setMappings(m.data.mappings || []);
    setMulank(n.data.mappings || []);
    setZodiac(z.data.mappings || []);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setPForm({ name: '', description: '' });
    setIForm({ name: '', purposeId: '', description: '' });
    setMForm({ intentionId: '', beadId: '', reason: '' });
    setNForm({ number: 1, beadId: '', reason: '' });
    setZForm({ sign: '', fromMonth: 1, fromDay: 1, toMonth: 1, toDay: 1, beadId: '', reason: '' });
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
    } else if (tab === 'mulank') {
      if (editing) await api.put(`/customizer/admin/mulank/${editing}`, nForm);
      else await api.post('/customizer/admin/mulank', nForm);
    } else if (tab === 'zodiac') {
      if (editing) await api.put(`/customizer/admin/zodiac/${editing}`, zForm);
      else await api.post('/customizer/admin/zodiac', zForm);
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
    else if (tab === 'mulank') await api.delete(`/customizer/admin/mulank/${remove._id}`);
    else if (tab === 'zodiac') await api.delete(`/customizer/admin/zodiac/${remove._id}`);
    else await api.delete(`/customizer/admin/mappings/${remove._id}`);
    setRemove(null);
    load();
  }

  const createLabel = {
    purposes: 'Create purpose',
    intentions: 'Create intention',
    mappings: 'Create mapping',
    mulank: 'Create Mulank mapping',
    zodiac: 'Create zodiac mapping',
  }[tab];

  return (
    <div>
      <AdminHeader
        title="Purposes & mappings"
        subtitle="Purpose → intention crystals, then Mulank calibration and zodiac beads."
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

      {tab === 'mulank' && (
        <AdminTable
          rows={mulank}
          columns={[
            { key: 'number', label: 'Mulank' },
            { key: 'bead', label: 'Crystal', render: (row) => row.beadId?.name || '—' },
            { key: 'reason', label: 'Calibration note', render: (row) => <span className="line-clamp-2 text-lilac">{row.reason}</span> },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <RowActions
                  onEdit={() => {
                    setEditing(row._id);
                    setNForm({ number: row.number, beadId: row.beadId?._id || row.beadId, reason: row.reason });
                    setOpen(true);
                  }}
                  onDelete={() => setRemove(row)}
                />
              ),
            },
          ]}
        />
      )}

      {tab === 'zodiac' && (
        <AdminTable
          rows={zodiac}
          columns={[
            { key: 'sign', label: 'Sign' },
            { key: 'range', label: 'Dates', render: (row) => `${row.fromMonth}/${row.fromDay} – ${row.toMonth}/${row.toDay}` },
            { key: 'bead', label: 'Bead', render: (row) => row.beadId?.name || '—' },
            { key: 'reason', label: 'Why', render: (row) => <span className="line-clamp-2 text-lilac">{row.reason}</span> },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <RowActions
                  onEdit={() => {
                    setEditing(row._id);
                    setZForm({
                      sign: row.sign,
                      fromMonth: row.fromMonth,
                      fromDay: row.fromDay,
                      toMonth: row.toMonth,
                      toDay: row.toDay,
                      beadId: row.beadId?._id || row.beadId,
                      reason: row.reason,
                    });
                    setOpen(true);
                  }}
                  onDelete={() => setRemove(row)}
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
          {tab === 'mulank' && (
            <>
              <label className={labelClass}>Mulank
                <select required className={`${fieldClass} mt-1`} value={nForm.number} onChange={(e) => setNForm({ ...nForm, number: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className={labelClass}>Crystal
                <select required className={`${fieldClass} mt-1`} value={nForm.beadId} onChange={(e) => setNForm({ ...nForm, beadId: e.target.value })}>
                  <option value="">Select</option>
                  {beads.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>Reason<textarea required className={`${fieldClass} mt-1`} value={nForm.reason} onChange={(e) => setNForm({ ...nForm, reason: e.target.value })} /></label>
            </>
          )}
          {tab === 'zodiac' && (
            <>
              <label className={labelClass}>Sign<input required className={`${fieldClass} mt-1`} value={zForm.sign} onChange={(e) => setZForm({ ...zForm, sign: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>From month<input type="number" min="1" max="12" required className={`${fieldClass} mt-1`} value={zForm.fromMonth} onChange={(e) => setZForm({ ...zForm, fromMonth: Number(e.target.value) })} /></label>
                <label className={labelClass}>From day<input type="number" min="1" max="31" required className={`${fieldClass} mt-1`} value={zForm.fromDay} onChange={(e) => setZForm({ ...zForm, fromDay: Number(e.target.value) })} /></label>
                <label className={labelClass}>To month<input type="number" min="1" max="12" required className={`${fieldClass} mt-1`} value={zForm.toMonth} onChange={(e) => setZForm({ ...zForm, toMonth: Number(e.target.value) })} /></label>
                <label className={labelClass}>To day<input type="number" min="1" max="31" required className={`${fieldClass} mt-1`} value={zForm.toDay} onChange={(e) => setZForm({ ...zForm, toDay: Number(e.target.value) })} /></label>
              </div>
              <label className={labelClass}>Bead
                <select required className={`${fieldClass} mt-1`} value={zForm.beadId} onChange={(e) => setZForm({ ...zForm, beadId: e.target.value })}>
                  <option value="">Select</option>
                  {beads.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>Reason<textarea required className={`${fieldClass} mt-1`} value={zForm.reason} onChange={(e) => setZForm({ ...zForm, reason: e.target.value })} /></label>
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
        body={remove ? `Remove “${remove.name || remove.sign || (remove.number != null ? `Mulank ${remove.number}` : remove.reason) || 'this record'}”?` : ''}
        onClose={() => setRemove(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
