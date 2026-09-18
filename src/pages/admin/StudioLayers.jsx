import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import MediaField from '../../components/admin/MediaField';
import { toast } from '../../lib/adminToast';

const TABS = [
  { id: 'zodiac', label: 'Zodiac' },
  { id: 'numerology', label: 'Numerology' },
  { id: 'planetary', label: 'Planetary' },
  { id: 'profession', label: 'Profession' },
];

const emptyByKind = {
  zodiac: {
    kind: 'zodiac',
    slug: '',
    name: '',
    hindi: '',
    dates: '',
    fromMonth: 1,
    fromDay: 1,
    toMonth: 1,
    toDay: 1,
    theme: '',
    description: '',
    image: '',
    sortOrder: 1,
    isActive: true,
    suitable: [],
    recommended: [],
  },
  numerology: {
    kind: 'numerology',
    slug: '1',
    name: '',
    number: 1,
    theme: '',
    description: '',
    image: '',
    sortOrder: 1,
    isActive: true,
    mulank: [],
    bhagyank: [],
  },
  planetary: {
    kind: 'planetary',
    slug: '',
    name: '',
    hindi: '',
    theme: '',
    description: '',
    image: '',
    sortOrder: 1,
    isActive: true,
    recommended: [],
  },
  profession: {
    kind: 'profession',
    slug: '',
    name: '',
    theme: '',
    description: '',
    image: '',
    sortOrder: 1,
    isActive: true,
    recommended: [],
  },
};

function BeadPick({ label, hint, beads, value, onChange }) {
  const [q, setQ] = useState('');
  const selected = new Set(value || []);
  const extras = (value || []).filter((name) => !beads.some((bead) => bead.name === name));
  const names = [...beads.map((bead) => bead.name), ...extras];
  const visible = names.filter((name) => name.toLowerCase().includes(q.toLowerCase()));
  function toggle(name) {
    const next = selected.has(name)
      ? (value || []).filter((n) => n !== name)
      : [...(value || []), name];
    onChange(next);
  }
  return (
    <div>
      <p className={labelClass}>{label}</p>
      {hint ? <p className="mt-1 text-xs text-lilac">{hint}</p> : null}
      <input
        className={`${fieldClass} mt-2`}
        placeholder="Filter beads"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-2 grid max-h-52 grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-gold/20 p-2">
        {visible.map((name) => (
          <label key={name} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-ivory hover:bg-gold/5">
            <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
            <span className="truncate">{name}</span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-lilac">{(value || []).length} selected · {(value || []).join(' · ') || 'none'}</p>
    </div>
  );
}

export default function AdminStudioLayers() {
  const [tab, setTab] = useState('zodiac');
  const [items, setItems] = useState([]);
  const [beads, setBeads] = useState([]);
  const [form, setForm] = useState(emptyByKind.zodiac);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);

  async function load() {
    const [layers, beadRes] = await Promise.all([
      api.get(`/customizer/admin/layers?kind=${tab}`),
      api.get('/customizer/admin/beads'),
    ]);
    setItems(layers.data.items || []);
    setBeads(beadRes.data.beads || []);
  }

  useEffect(() => {
    load().catch((err) => toast(err.message || 'Could not load catalogs.', 'error'));
  }, [tab]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyByKind[tab], kind: tab, sortOrder: items.length + 1 });
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row._id);
    setForm({ ...emptyByKind[tab], ...row, kind: tab });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, kind: tab };
    if (tab === 'numerology') {
      payload.slug = String(payload.number || payload.slug);
      payload.name = payload.theme || payload.name;
    }
    try {
      if (editing) await api.put(`/customizer/admin/layers/${editing}`, payload);
      else await api.post('/customizer/admin/layers', payload);
      toast(editing ? 'Catalog row saved.' : 'Catalog row created.');
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save.', 'error');
    }
  }

  async function restore() {
    if (!window.confirm(`Replace all ${tab} rows with the original Excel catalog? Custom edits on this tab will be lost.`)) {
      return;
    }
    try {
      await api.post('/customizer/admin/layers/restore', { kind: tab });
      toast('Excel catalog defaults restored for this tab.');
      load();
    } catch (err) {
      toast(err.message || 'Could not restore.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader
        title="Layer catalogs"
        subtitle="Zodiac, numerology, planetary and profession combinations. Bead prices stay on Beads. The storefront reads these rows live."
        onCreate={openCreate}
        createLabel="Add row"
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          onClick={restore}
          className="ml-auto rounded-full border border-gold/40 px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10"
        >
          Restore Excel defaults
        </button>
      </div>
      <AdminTable
        rows={items}
        empty="No rows in this catalog yet."
        columns={[
          {
            key: 'name',
            label: tab === 'numerology' ? 'Number' : 'Name',
            render: (row) => (
              <div className="flex items-center gap-2">
                {row.image ? <img src={mediaUrl(row.image)} alt="" className="h-8 w-8 rounded object-contain" /> : null}
                <div>
                <div className="font-medium">{row.hindi ? `${row.hindi} / ${row.name || row.theme}` : (row.name && !/^number\s*\d+$/i.test(row.name) ? row.name : row.theme) || '—'}</div>
                <div className="text-xs text-lilac">{row.slug}{row.dates ? ` · ${row.dates}` : ''}</div>
                </div>
              </div>
            ),
          },
          { key: 'theme', label: 'Theme', render: (row) => <span className="text-sm text-lilac">{row.theme || '—'}</span> },
          {
            key: 'beads',
            label: tab === 'numerology' ? 'Mulank · Bhagyank' : 'Recommended',
            render: (row) => (
              <span className="text-xs text-lilac">
                {tab === 'numerology'
                  ? `${(row.mulank || []).join(', ') || '—'} · ${(row.bhagyank || []).join(', ') || '—'}`
                  : (row.recommended || []).join(', ') || '—'}
              </span>
            ),
          },
          { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Hidden') },
          { key: 'actions', label: 'Actions', align: 'right', render: (row) => <RowActions onEdit={() => openEdit(row)} onDelete={() => setRemove(row)} /> },
        ]}
      />
      <AdminDrawer open={open} title={editing ? 'Edit catalog row' : 'Add catalog row'} onClose={() => setOpen(false)} wide>
        <form onSubmit={save} className="space-y-3">
          {tab === 'numerology' ? (
            <label className={labelClass}>
              Number (1–9)
              <input
                required
                type="number"
                min={1}
                max={9}
                className={`${fieldClass} mt-1`}
                value={form.number || ''}
                onChange={(e) => setForm({ ...form, number: Number(e.target.value), slug: e.target.value })}
              />
            </label>
          ) : (
            <>
              <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              {(tab === 'zodiac' || tab === 'planetary') && (
                <label className={labelClass}>Hindi<input className={`${fieldClass} mt-1`} value={form.hindi || ''} onChange={(e) => setForm({ ...form, hindi: e.target.value })} /></label>
              )}
              <label className={labelClass}>Slug<input className={`${fieldClass} mt-1`} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="aries" /></label>
            </>
          )}
          {tab === 'zodiac' && (
            <>
              <label className={labelClass}>Dates<input className={`${fieldClass} mt-1`} value={form.dates || ''} onChange={(e) => setForm({ ...form, dates: e.target.value })} placeholder="Mar 21 – Apr 19" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>From month<input type="number" min={1} max={12} className={`${fieldClass} mt-1`} value={form.fromMonth || ''} onChange={(e) => setForm({ ...form, fromMonth: e.target.value })} /></label>
                <label className={labelClass}>From day<input type="number" min={1} max={31} className={`${fieldClass} mt-1`} value={form.fromDay || ''} onChange={(e) => setForm({ ...form, fromDay: e.target.value })} /></label>
                <label className={labelClass}>To month<input type="number" min={1} max={12} className={`${fieldClass} mt-1`} value={form.toMonth || ''} onChange={(e) => setForm({ ...form, toMonth: e.target.value })} /></label>
                <label className={labelClass}>To day<input type="number" min={1} max={31} className={`${fieldClass} mt-1`} value={form.toDay || ''} onChange={(e) => setForm({ ...form, toDay: e.target.value })} /></label>
              </div>
            </>
          )}
          <label className={labelClass}>Theme<input className={`${fieldClass} mt-1`} value={form.theme || ''} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></label>
          <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shown on the storefront box" /></label>
          <MediaField label="Box image" folder="studio" value={form.image || ''} onChange={(image) => setForm({ ...form, image })} />
          <label className={labelClass}>Sort order<input type="number" className={`${fieldClass} mt-1`} value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
          {tab === 'numerology' ? (
            <>
              <BeadPick label="Mulank beads" hint="Customer may pick any 3 or all 4." beads={beads} value={form.mulank} onChange={(mulank) => setForm({ ...form, mulank })} />
              <BeadPick label="Bhagyank beads" hint="Kept as a separate layer in the snapshot." beads={beads} value={form.bhagyank} onChange={(bhagyank) => setForm({ ...form, bhagyank })} />
            </>
          ) : (
            <>
              {tab === 'zodiac' && (
                <BeadPick label="All suitable beads" hint="Wider catalog pool for this sign." beads={beads} value={form.suitable} onChange={(suitable) => setForm({ ...form, suitable })} />
              )}
              <BeadPick label="Recommended combination" hint="Core set shown first. Typically 4 crystals." beads={beads} value={form.recommended} onChange={(recommended) => setForm({ ...form, recommended })} />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-lilac">
            <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active on storefront
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
      <ConfirmDelete
        open={!!remove}
        title="Delete catalog row"
        body={remove ? `Remove “${remove.name || remove.slug}” from ${tab}? The storefront will stop offering it.` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/customizer/admin/layers/${remove._id}`);
          setRemove(null);
          load();
        }}
      />
    </div>
  );
}
