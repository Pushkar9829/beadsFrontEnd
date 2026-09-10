import { useCustomizerStore } from '../../store/customizerStore';
import { THREAD_TYPES } from '../../lib/format';

export default function NameStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const threadType = useCustomizerStore((s) => s.threadType);
  const setThreadType = useCustomizerStore((s) => s.setThreadType);
  const config = useCustomizerStore((s) => s.config);
  const steelCore = threadType === 'steel-core';

  return (
    <div className="studio-birth">
      <div>
        <p className="studio-birth-kicker">Charm</p>
        <div className="studio-charm-row">
          {charms.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => selectCharm(c)}
              className={`studio-charm-card ${charm?._id === c._id ? 'is-on' : ''}`}
            >
              <strong>{c.name}</strong>
              <span>{c.description || (c.slug === 'om' ? 'Om at the clasp.' : 'Sriyantra at the clasp.')}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="studio-birth-kicker">Thread</p>
        <div className="studio-charm-row">
          {THREAD_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setThreadType(t.key)}
              className={`studio-charm-card ${threadType === t.key ? 'is-on' : ''}`}
            >
              <strong>{t.label}</strong>
              <span>{t.detail}</span>
            </button>
          ))}
        </div>
      </div>

      {steelCore && (
        <div>
          <p className="studio-birth-kicker">Wrist size</p>
          <div className="studio-qty studio-qty-sm">
            {(config?.wristSizes || []).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setWristSize(size)}
                className={`studio-qty-btn ${wristSize === size ? 'is-on' : ''}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
