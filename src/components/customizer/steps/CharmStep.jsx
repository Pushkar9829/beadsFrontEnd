import { useCustomizerStore } from '../../../store/customizerStore';
import { mediaUrl } from '../../../api/client';
import { useStudioLabels } from '../../../lib/studioTheme';

export default function CharmStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const setFinish = useCustomizerStore((s) => s.setFinish);
  const threadType = useCustomizerStore((s) => s.threadType);
  const setThreadType = useCustomizerStore((s) => s.setThreadType);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const config = useCustomizerStore((s) => s.config);
  const labels = useStudioLabels();
  const finishes = charm?.finishes || [];
  const threads = config?.threadTypes?.length ? config.threadTypes : [
    { key: 'korean-elastic', label: 'Korean elastic thread', detail: 'Free-size fit' },
    { key: 'steel-core', label: 'Steel core thread', detail: 'Cut to your wrist size' },
  ];
  const wristSizes = config?.wristSizes || ['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'];
  const steel = threadType === 'steel-core';

  return (
    <div className="studio-birth space-y-7">
      <div>
        <p className="studio-birth-kicker">{labels.charmLabel}</p>
        <div className="studio-charm-row">
          {charms.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => selectCharm(c, finish?.key ? c.finishes?.find((f) => f.key === finish.key) : undefined)}
              className={`studio-charm-card ${String(charm?._id) === String(c._id) ? 'is-on' : ''}`}
            >
              {c.image ? <img src={mediaUrl(c.image)} alt="" className="studio-charm-thumb" /> : null}
              <strong>{c.name}</strong>
            </button>
          ))}
        </div>
      </div>
      {finishes.length > 1 ? (
        <div>
          <p className="studio-birth-kicker">{labels.finishLabel}</p>
          <div className="studio-charm-row">
            {finishes.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setFinish(row)}
                className={`studio-charm-card ${finish?.key === row.key ? 'is-on' : ''}`}
              >
                <strong>{row.label || row.key}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <p className="studio-birth-kicker">{labels.threadLabel}</p>
        <div className="studio-charm-row">
          {threads.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setThreadType(t.key)}
              className={`studio-charm-card ${threadType === t.key ? 'is-on' : ''}`}
            >
              <strong>{t.label}</strong>
              {t.detail ? <span>{t.detail}</span> : null}
            </button>
          ))}
        </div>
      </div>
      {steel ? (
        <div>
          <p className="studio-birth-kicker">{labels.wristLabel}</p>
          <div className="studio-qty studio-qty-sm mt-3">
            {wristSizes.map((size) => (
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
      ) : null}
    </div>
  );
}
