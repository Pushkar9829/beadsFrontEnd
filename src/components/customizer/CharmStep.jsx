import { useCustomizerStore } from '../../store/customizerStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function CharmStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const setFinish = useCustomizerStore((s) => s.setFinish);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const config = useCustomizerStore((s) => s.config);
  const setStep = useCustomizerStore((s) => s.setStep);

  return (
    <div>
      <Button variant="text" onClick={() => setStep(3)}>← Beads</Button>
      <h2 className="mt-2 font-serif text-2xl gold-text">Charm & wrist size</h2>
      <p className="mt-2 text-sm text-lilac">The oval charm is our signature finish. It appears on the live preview and order summary.</p>
      <div className="mt-6 grid gap-4">
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
        className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
      >
        {(config?.wristSizes || []).map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setStep(5)}>Review & order</Button>
      </div>
    </div>
  );
}
