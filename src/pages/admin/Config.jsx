import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import MediaField from '../../components/admin/MediaField';
import { toast } from '../../lib/adminToast';

const EMPTY_CHARM = {
  name: '',
  description: '',
  image: '',
  isActive: true,
  finishes: [{ key: 'gold', label: 'Gold', price: 0, metalColor: '#D4AF37' }],
};

function updateRow(list, index, patch) {
  return list.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

function OptionArtFields({ row, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <label className={labelClass}>
        Icon (emoji)
        <input className={`${fieldClass} mt-1`} value={row.icon || ''} onChange={(e) => onChange({ icon: e.target.value })} placeholder="✨" />
      </label>
      <MediaField label="Image (wins over icon)" folder="studio" value={row.image || ''} onChange={(image) => onChange({ image })} />
    </div>
  );
}

export default function AdminConfig() {
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [charms, setCharms] = useState([]);
  const [charmDraft, setCharmDraft] = useState(null);
  const [wrist, setWrist] = useState('');
  const [sizeMm, setSizeMm] = useState('');
  const [openConfig, setOpenConfig] = useState(false);
  const [openCharm, setOpenCharm] = useState(false);

  async function load() {
    const { data } = await api.get('/customizer/admin/charms');
    setConfig(data.config);
    setCharms(data.charms || []);
  }
  useEffect(() => { load(); }, []);

  if (!config) return null;

  const rows = [
    { key: 'beadLimit', label: 'Bead limit', value: config.beadLimit },
    { key: 'minBeads', label: 'Minimum beads', value: config.minBeads },
    { key: 'crystalMin', label: 'Crystal min', value: config.crystalMin },
    { key: 'crystalMax', label: 'Crystal max', value: config.crystalMax },
    { key: 'crystalMaxNumerology', label: 'Numerology crystal max', value: config.crystalMaxNumerology },
    { key: 'intentionCap', label: 'Intention cap', value: config.intentionCap },
    { key: 'beadSizesMm', label: 'Bead sizes', value: (config.beadSizesMm || []).join(', ') },
    { key: 'defaultBeadSizeMm', label: 'Default bead size', value: `${config.defaultBeadSizeMm || 8}mm` },
    { key: 'defaultWristSize', label: 'Default wrist size', value: config.defaultWristSize },
    { key: 'wristSizes', label: 'Wrist sizes', value: (config.wristSizes || []).join(', ') },
    { key: 'threads', label: 'Thread types', value: (config.threadTypes || []).map((t) => t.label).join(' · ') },
    { key: 'cz', label: 'CZ options', value: (config.czOptions || []).map((t) => t.label).join(' · ') },
    { key: 'paths', label: 'Active paths', value: (config.studioModes || []).filter((m) => m.isActive !== false).map((m) => m.short).join(' · ') },
    { key: 'box', label: config.packagingLabels?.box || 'Box', value: config.packaging?.box ?? 44, money: true },
    { key: 'clasp', label: config.packagingLabels?.clasp || 'Clasp', value: config.packaging?.clasp ?? 10, money: true },
    { key: 'charm', label: config.packagingLabels?.charm || 'Charm', value: config.packaging?.charm ?? 60, money: true },
    { key: 'thread', label: config.packagingLabels?.thread || 'Thread', value: config.packaging?.thread ?? 20, money: true },
  ];

  return (
    <div className="space-y-10">
      <div>
        <AdminHeader
          title="Bracelet config"
          subtitle="Every customizer option, limit, path label, and packaging cost."
          onCreate={() => { setDraft({ ...config, packaging: { ...(config.packaging || {}) }, packagingLabels: { ...(config.packagingLabels || {}) } }); setOpenConfig(true); }}
          createLabel="Edit config"
        />
        <AdminTable
          rows={rows}
          rowKey={(r) => r.key}
          columns={[
            { key: 'label', label: 'Setting' },
            { key: 'value', label: 'Value', render: (r) => r.money ? <Price value={r.value} /> : String(r.value ?? '—') },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: () => <RowActions onEdit={() => { setDraft({ ...config, packaging: { ...(config.packaging || {}) }, packagingLabels: { ...(config.packagingLabels || {}) } }); setOpenConfig(true); }} />,
            },
          ]}
        />
      </div>

      <div>
        <AdminHeader
          title="Charms"
          subtitle="Shown on the finish step. Inactive charms stay hidden on the storefront."
          onCreate={() => { setCharmDraft({ ...EMPTY_CHARM, finishes: EMPTY_CHARM.finishes.map((f) => ({ ...f })) }); setOpenCharm(true); }}
          createLabel="Add charm"
        />
        <AdminTable
          rows={charms}
          columns={[
            { key: 'name', label: 'Charm', render: (c) => (
              <span className="flex items-center gap-2">
                {c.image ? <img src={mediaUrl(c.image)} alt="" className="h-8 w-8 rounded object-contain" /> : null}
                {c.name}
              </span>
            ) },
            { key: 'description', label: 'Description', render: (c) => <span className="line-clamp-2 text-lilac">{c.description || '—'}</span> },
            { key: 'isActive', label: 'Status', render: (c) => (c.isActive === false ? 'Hidden' : 'Active') },
            { key: 'finishes', label: 'Finishes', render: (c) => c.finishes?.map((f) => `${f.label} (${f.price})`).join(' · ') },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (c) => (
                <RowActions
                  onEdit={() => { setCharmDraft(JSON.parse(JSON.stringify(c))); setOpenCharm(true); }}
                  onDelete={async () => {
                    await api.delete(`/customizer/admin/charms/${c._id}`);
                    toast('Charm removed.');
                    load();
                  }}
                />
              ),
            },
          ]}
        />
      </div>

      <AdminDrawer open={openConfig} title="Edit bracelet config" onClose={() => setOpenConfig(false)} wide>
        {draft && (
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put('/customizer/admin/config', draft);
                toast('Config saved.');
                setOpenConfig(false);
                load();
              } catch (err) {
                toast(err.message || 'Could not save config.', 'error');
              }
            }}
          >
            <p className={labelClass}>Limits</p>
            <label className={labelClass}>Bead limit<input type="number" className={`${fieldClass} mt-1`} value={draft.beadLimit} onChange={(e) => setDraft({ ...draft, beadLimit: Number(e.target.value) })} /></label>
            <label className={labelClass}>Min beads<input type="number" className={`${fieldClass} mt-1`} value={draft.minBeads} onChange={(e) => setDraft({ ...draft, minBeads: Number(e.target.value) })} /></label>
            <label className={labelClass}>Crystal min<input type="number" className={`${fieldClass} mt-1`} value={draft.crystalMin ?? 3} onChange={(e) => setDraft({ ...draft, crystalMin: Number(e.target.value) })} /></label>
            <label className={labelClass}>Crystal max<input type="number" className={`${fieldClass} mt-1`} value={draft.crystalMax ?? 5} onChange={(e) => setDraft({ ...draft, crystalMax: Number(e.target.value) })} /></label>
            <label className={labelClass}>Numerology crystal max<input type="number" className={`${fieldClass} mt-1`} value={draft.crystalMaxNumerology ?? 8} onChange={(e) => setDraft({ ...draft, crystalMaxNumerology: Number(e.target.value) })} /></label>
            <label className={labelClass}>Intention cap<input type="number" className={`${fieldClass} mt-1`} value={draft.intentionCap ?? 3} onChange={(e) => setDraft({ ...draft, intentionCap: Number(e.target.value) })} /></label>
            <label className={labelClass}>Engraving max length<input type="number" className={`${fieldClass} mt-1`} value={draft.engravingMaxLength ?? 24} onChange={(e) => setDraft({ ...draft, engravingMaxLength: Number(e.target.value) })} /></label>
            <label className="flex items-center gap-2 text-sm text-lilac">
              <input type="checkbox" checked={draft.charmRequired !== false} onChange={(e) => setDraft({ ...draft, charmRequired: e.target.checked })} />
              Charm required on finish
            </label>
            <label className={labelClass}>Charm hint<input className={`${fieldClass} mt-1`} value={draft.charmHint || ''} onChange={(e) => setDraft({ ...draft, charmHint: e.target.value })} /></label>

            <p className={labelClass}>Bead sizes (mm)</p>
            <div className="flex flex-wrap gap-2">
              {(draft.beadSizesMm || []).map((mm) => (
                <span key={mm} className="rounded-full border border-gold/30 px-3 py-1 text-sm">
                  {mm}mm
                  <button type="button" className="ml-2 text-red-300" onClick={() => setDraft({ ...draft, beadSizesMm: draft.beadSizesMm.filter((x) => x !== mm) })}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={sizeMm} onChange={(e) => setSizeMm(e.target.value)} placeholder="e.g. 10" className={fieldClass} />
              <Button type="button" variant="ghost" onClick={() => {
                const n = Number(sizeMm);
                if (!n) return;
                setDraft({ ...draft, beadSizesMm: [...new Set([...(draft.beadSizesMm || []), n])] });
                setSizeMm('');
              }}>Add</Button>
            </div>
            <label className={labelClass}>Default bead size (mm)
              <select className={`${fieldClass} mt-1`} value={draft.defaultBeadSizeMm ?? 8} onChange={(e) => setDraft({ ...draft, defaultBeadSizeMm: Number(e.target.value) })}>
                {(draft.beadSizesMm || []).map((mm) => <option key={mm} value={mm}>{mm}mm</option>)}
              </select>
            </label>

            <label className={labelClass}>Default wrist
              <select className={`${fieldClass} mt-1`} value={draft.defaultWristSize} onChange={(e) => setDraft({ ...draft, defaultWristSize: e.target.value })}>
                {(draft.wristSizes || []).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <p className={labelClass}>Wrist sizes</p>
            <div className="flex flex-wrap gap-2">
              {(draft.wristSizes || []).map((s) => (
                <span key={s} className="rounded-full border border-gold/30 px-3 py-1 text-sm">
                  {s}
                  <button type="button" className="ml-2 text-red-300" onClick={() => setDraft({ ...draft, wristSizes: draft.wristSizes.filter((x) => x !== s) })}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={wrist} onChange={(e) => setWrist(e.target.value)} placeholder='e.g. 8.5"' className={fieldClass} />
              <Button type="button" variant="ghost" onClick={() => { if (wrist) { setDraft({ ...draft, wristSizes: [...draft.wristSizes, wrist] }); setWrist(''); } }}>Add</Button>
            </div>

            <p className={labelClass}>Thread types</p>
            {(draft.threadTypes || []).map((row, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-gold/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <input className={fieldClass} value={row.key} onChange={(e) => setDraft({ ...draft, threadTypes: updateRow(draft.threadTypes, i, { key: e.target.value }) })} placeholder="key" />
                  <input className={fieldClass} value={row.label} onChange={(e) => setDraft({ ...draft, threadTypes: updateRow(draft.threadTypes, i, { label: e.target.value }) })} placeholder="label" />
                  <input className={fieldClass} value={row.detail || ''} onChange={(e) => setDraft({ ...draft, threadTypes: updateRow(draft.threadTypes, i, { detail: e.target.value }) })} placeholder="detail" />
                </div>
                <OptionArtFields row={row} onChange={(patch) => setDraft({ ...draft, threadTypes: updateRow(draft.threadTypes, i, patch) })} />
                <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, threadTypes: draft.threadTypes.filter((_, idx) => idx !== i) })}>Remove thread</button>
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, threadTypes: [...(draft.threadTypes || []), { key: '', label: '', detail: '' }] })}>Add thread</Button>
            <label className={labelClass}>Default thread
              <select className={`${fieldClass} mt-1`} value={draft.defaultThreadType || ''} onChange={(e) => setDraft({ ...draft, defaultThreadType: e.target.value })}>
                {(draft.threadTypes || []).map((t) => <option key={t.key} value={t.key}>{t.label || t.key}</option>)}
              </select>
            </label>

            <p className={labelClass}>CZ options</p>
            {(draft.czOptions || []).map((row, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-gold/20 p-3">
                <div className="grid grid-cols-4 gap-2">
                  <input className={fieldClass} value={row.key} onChange={(e) => setDraft({ ...draft, czOptions: updateRow(draft.czOptions, i, { key: e.target.value }) })} placeholder="key" />
                  <input className={fieldClass} value={row.label} onChange={(e) => setDraft({ ...draft, czOptions: updateRow(draft.czOptions, i, { label: e.target.value }) })} placeholder="label" />
                  <input className={fieldClass} value={row.detail || ''} onChange={(e) => setDraft({ ...draft, czOptions: updateRow(draft.czOptions, i, { detail: e.target.value }) })} placeholder="detail" />
                  <input type="number" className={fieldClass} value={row.price ?? 0} onChange={(e) => setDraft({ ...draft, czOptions: updateRow(draft.czOptions, i, { price: Number(e.target.value) }) })} placeholder="price" />
                </div>
                <OptionArtFields row={row} onChange={(patch) => setDraft({ ...draft, czOptions: updateRow(draft.czOptions, i, patch) })} />
                <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, czOptions: draft.czOptions.filter((_, idx) => idx !== i) })}>Remove CZ option</button>
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, czOptions: [...(draft.czOptions || []), { key: '', label: '', detail: '', price: 0 }] })}>Add CZ option</Button>
            <label className={labelClass}>Default CZ
              <select className={`${fieldClass} mt-1`} value={draft.defaultCzStyle || ''} onChange={(e) => setDraft({ ...draft, defaultCzStyle: e.target.value })}>
                {(draft.czOptions || []).map((t) => <option key={t.key} value={t.key}>{t.label || t.key}</option>)}
              </select>
            </label>

            <p className={labelClass}>Packaging prices and labels</p>
            {['box', 'clasp', 'charm', 'thread'].map((key) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <input className={fieldClass} value={draft.packagingLabels?.[key] || ''} onChange={(e) => setDraft({ ...draft, packagingLabels: { ...(draft.packagingLabels || {}), [key]: e.target.value } })} placeholder={`${key} label`} />
                <input type="number" className={fieldClass} value={draft.packaging?.[key] ?? 0} onChange={(e) => setDraft({ ...draft, packaging: { ...(draft.packaging || {}), [key]: Number(e.target.value) } })} />
              </div>
            ))}

            <p className={labelClass}>Customization paths</p>
            {(draft.studioModes || []).map((mode, i) => (
              <div key={mode.slug || i} className="space-y-2 rounded-xl border border-gold/20 p-3">
                <label className="flex items-center gap-2 text-sm text-lilac">
                  <input type="checkbox" checked={mode.isActive !== false} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { isActive: e.target.checked }) })} />
                  Active · {mode.slug}
                </label>
                <input className={fieldClass} value={mode.short || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { short: e.target.value }) })} placeholder="Nav short label" />
                <input className={fieldClass} value={mode.label || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { label: e.target.value }) })} placeholder="Menu label" />
                <input className={fieldClass} value={mode.eyebrow || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { eyebrow: e.target.value }) })} placeholder="Eyebrow" />
                <input className={fieldClass} value={mode.title || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { title: e.target.value }) })} placeholder="Title" />
                <textarea className={fieldClass} value={mode.body || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { body: e.target.value }) })} placeholder="Body" />
                <input className={fieldClass} value={mode.chooseHint || ''} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { chooseHint: e.target.value }) })} placeholder="Choose-step hint" />
                <input type="number" className={fieldClass} value={mode.sortOrder ?? i + 1} onChange={(e) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, { sortOrder: Number(e.target.value) }) })} placeholder="Order" />
                <OptionArtFields row={mode} onChange={(patch) => setDraft({ ...draft, studioModes: updateRow(draft.studioModes, i, patch) })} />
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => setOpenConfig(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>

      <AdminDrawer open={openCharm} title={charmDraft?._id ? 'Edit charm' : 'Add charm'} onClose={() => setOpenCharm(false)}>
        {charmDraft && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (charmDraft._id) await api.put(`/customizer/admin/charms/${charmDraft._id}`, charmDraft);
                else await api.post('/customizer/admin/charms', charmDraft);
                toast(charmDraft._id ? 'Charm saved.' : 'Charm created.');
                setOpenCharm(false);
                load();
              } catch (err) {
                toast(err.message || 'Could not save charm.', 'error');
              }
            }}
          >
            <label className={labelClass}>Name<input className={`${fieldClass} mt-1`} value={charmDraft.name} onChange={(e) => setCharmDraft({ ...charmDraft, name: e.target.value })} /></label>
            <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={charmDraft.description || ''} onChange={(e) => setCharmDraft({ ...charmDraft, description: e.target.value })} /></label>
            <MediaField label="Box image" folder="charm" value={charmDraft.image || ''} onChange={(image) => setCharmDraft({ ...charmDraft, image })} />
            <label className="flex items-center gap-2 text-sm text-lilac">
              <input type="checkbox" checked={charmDraft.isActive !== false} onChange={(e) => setCharmDraft({ ...charmDraft, isActive: e.target.checked })} />
              Active on storefront
            </label>
            {(charmDraft.finishes || []).map((f, i) => (
              <div key={f.key || i} className="grid grid-cols-3 gap-2">
                <input value={f.label} onChange={(e) => {
                  const finishes = charmDraft.finishes.map((ff, idx) => idx === i ? { ...ff, label: e.target.value } : ff);
                  setCharmDraft({ ...charmDraft, finishes });
                }} className={fieldClass} />
                <input type="number" value={f.price} onChange={(e) => {
                  const finishes = charmDraft.finishes.map((ff, idx) => idx === i ? { ...ff, price: Number(e.target.value) } : ff);
                  setCharmDraft({ ...charmDraft, finishes });
                }} className={fieldClass} />
                <input value={f.metalColor} onChange={(e) => {
                  const finishes = charmDraft.finishes.map((ff, idx) => idx === i ? { ...ff, metalColor: e.target.value } : ff);
                  setCharmDraft({ ...charmDraft, finishes });
                }} className={fieldClass} />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => setOpenCharm(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>
    </div>
  );
}
