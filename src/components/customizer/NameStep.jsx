import { useCustomizerStore } from '../../store/customizerStore';

export default function NameStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const setFinish = useCustomizerStore((s) => s.setFinish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const config = useCustomizerStore((s) => s.config);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const setEngravingName = useCustomizerStore((s) => s.setEngravingName);

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
        Final name
        <input
          value={engravingName}
          onChange={(e) => setEngravingName(e.target.value)}
          maxLength={32}
          placeholder="e.g. Aarav"
          className="contact-input mt-2"
        />
      </label>

      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold">Charm & finish</p>
      <div className="mt-4 grid gap-3">
        {charms.map((c) => (
          <div
            key={c._id}
            className={`purpose-card w-full text-left ${charm?._id === c._id ? 'is-on' : ''}`}
          >
            <button type="button" onClick={() => selectCharm(c)} className="w-full text-left">
              <h3 className="font-serif text-xl">{c.name}</h3>
              <p className="mt-1 text-sm text-lilac">{c.description}</p>
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.finishes.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    selectCharm(c, f);
                    setFinish(f);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                    finish?.key === f.key ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-lilac'
                  }`}
                >
                  <span className="h-2.5 w-3 rounded-full" style={{ background: f.metalColor }} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-8 block text-[11px] uppercase tracking-[0.18em] text-gold">
        Wrist size
        <select
          value={wristSize}
          onChange={(e) => setWristSize(e.target.value)}
          className="studio-select mt-2"
        >
          {(config?.wristSizes || []).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
