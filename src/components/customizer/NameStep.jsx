import { useCustomizerStore } from '../../store/customizerStore';
import Card from '../ui/Card';

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
      <h2 className="font-serif text-2xl gold-text">Name the piece</h2>
      <p className="mt-2 text-sm text-lilac">
        This name is engraved on the oval charm and shown on the order.
      </p>
      <label className="mt-6 block text-xs uppercase tracking-widest text-gold">
        Final name
        <input
          value={engravingName}
          onChange={(e) => setEngravingName(e.target.value)}
          maxLength={32}
          placeholder="e.g. Aarav"
          className="mt-2 w-full rounded-xl border border-gold/30 bg-raised px-3 py-2.5 text-ivory"
        />
      </label>

      <h3 className="mt-8 font-serif text-xl gold-text">Charm & wrist size</h3>
      <div className="mt-4 grid gap-4">
        {charms.map((c) => (
          <Card
            key={c._id}
            onClick={() => selectCharm(c)}
            className={`p-4 ${charm?._id === c._id ? 'ring-1 ring-gold' : ''}`}
          >
            <h3 className="font-serif text-xl">{c.name}</h3>
            <p className="text-sm text-lilac">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.finishes.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCharm(c, f);
                    setFinish(f);
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-widest ${
                    finish?.key === f.key ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-lilac'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: f.metalColor }} />
                  {f.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <label className="mt-6 block text-xs uppercase tracking-widest text-gold">Wrist size</label>
      <select
        value={wristSize}
        onChange={(e) => setWristSize(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gold/30 bg-raised px-3 py-2.5 text-ivory"
      >
        {(config?.wristSizes || []).map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
