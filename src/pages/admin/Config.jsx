import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Price from '../../components/ui/Price';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

export default function AdminConfig() {
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [charms, setCharms] = useState([]);
  const [charmDraft, setCharmDraft] = useState(null);
  const [wrist, setWrist] = useState('');
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
    { key: 'baseMakingPrice', label: 'Base making price', value: config.baseMakingPrice, money: true },
    { key: 'defaultWristSize', label: 'Default wrist size', value: config.defaultWristSize },
    { key: 'wristSizes', label: 'Wrist sizes', value: (config.wristSizes || []).join(', ') },
  ];

  return (
    <div className="space-y-10">
      <div>
        <AdminHeader
          title="Bracelet config"
          subtitle="Limits and making price used by the customizer."
          onCreate={() => { setDraft({ ...config }); setOpenConfig(true); }}
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
              render: () => <RowActions onEdit={() => { setDraft({ ...config }); setOpenConfig(true); }} />,
            },
          ]}
        />
      </div>

      <div>
        <h2 className="mb-4 font-serif text-2xl gold-text">Charms</h2>
        <AdminTable
          rows={charms}
          columns={[
            { key: 'name', label: 'Charm' },
            { key: 'finishes', label: 'Finishes', render: (c) => c.finishes?.map((f) => `${f.label} (${f.price})`).join(' · ') },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (c) => <RowActions onEdit={() => { setCharmDraft(JSON.parse(JSON.stringify(c))); setOpenCharm(true); }} />,
            },
          ]}
        />
      </div>

      <AdminDrawer open={openConfig} title="Edit bracelet config" onClose={() => setOpenConfig(false)}>
        {draft && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.put('/customizer/admin/config', draft);
              setOpenConfig(false);
              load();
            }}
          >
            <label className={labelClass}>Bead limit<input type="number" className={`${fieldClass} mt-1`} value={draft.beadLimit} onChange={(e) => setDraft({ ...draft, beadLimit: Number(e.target.value) })} /></label>
            <label className={labelClass}>Min beads<input type="number" className={`${fieldClass} mt-1`} value={draft.minBeads} onChange={(e) => setDraft({ ...draft, minBeads: Number(e.target.value) })} /></label>
            <label className={labelClass}>Base making price<input type="number" className={`${fieldClass} mt-1`} value={draft.baseMakingPrice} onChange={(e) => setDraft({ ...draft, baseMakingPrice: Number(e.target.value) })} /></label>
            <label className={labelClass}>Default wrist
              <select className={`${fieldClass} mt-1`} value={draft.defaultWristSize} onChange={(e) => setDraft({ ...draft, defaultWristSize: e.target.value })}>
                {(draft.wristSizes || []).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <div>
              <p className={labelClass}>Wrist sizes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(draft.wristSizes || []).map((s) => (
                  <span key={s} className="rounded-full border border-gold/30 px-3 py-1 text-sm">
                    {s}
                    <button type="button" className="ml-2 text-red-300" onClick={() => setDraft({ ...draft, wristSizes: draft.wristSizes.filter((x) => x !== s) })}>×</button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={wrist} onChange={(e) => setWrist(e.target.value)} placeholder='e.g. 8.5"' className={fieldClass} />
                <Button type="button" variant="ghost" onClick={() => { if (wrist) { setDraft({ ...draft, wristSizes: [...draft.wristSizes, wrist] }); setWrist(''); } }}>Add</Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => setOpenConfig(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminDrawer>

      <AdminDrawer open={openCharm} title="Edit charm" onClose={() => setOpenCharm(false)}>
        {charmDraft && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.put(`/customizer/admin/charms/${charmDraft._id}`, charmDraft);
              setOpenCharm(false);
              load();
            }}
          >
            <label className={labelClass}>Name<input className={`${fieldClass} mt-1`} value={charmDraft.name} onChange={(e) => setCharmDraft({ ...charmDraft, name: e.target.value })} /></label>
            {charmDraft.finishes.map((f, i) => (
              <div key={f.key} className="grid grid-cols-3 gap-2">
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
