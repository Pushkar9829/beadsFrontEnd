import { useCustomizerStore } from '../../../store/customizerStore';
import { mediaUrl } from '../../../api/client';
import { useStudioLabels } from '../../../lib/studioTheme';
import OptionArt from '../OptionArt';

export default function FinishStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const setFinish = useCustomizerStore((s) => s.setFinish);
  const czStyle = useCustomizerStore((s) => s.czStyle);
  const setCzStyle = useCustomizerStore((s) => s.setCzStyle);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const setEngravingName = useCustomizerStore((s) => s.setEngravingName);
  const config = useCustomizerStore((s) => s.config);
  const labels = useStudioLabels();
  const finishes = charm?.finishes || [];
  const czOptions = config?.czOptions?.length ? config.czOptions : [
    { key: 'cz', label: 'CZ', detail: 'Classic cut accent.' },
    { key: 'round', label: 'Round CZ', detail: 'Round cut accent.' },
  ];
  const maxName = Number(config?.engravingMaxLength) || 24;

  return (
    <div className="studio-birth space-y-7">
      <div>
        <p className="studio-birth-kicker">{labels.charmLabel}</p>
        {charms.length ? (
          <div className="studio-charm-row">
            {charms.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() =>
                  selectCharm(c, finish?.key ? c.finishes?.find((f) => f.key === finish.key) : undefined)
                }
                className={`studio-charm-card ${String(charm?._id) === String(c._id) ? 'is-on' : ''}`}
              >
                {c.image ? <img src={mediaUrl(c.image)} alt="" className="studio-charm-thumb" /> : null}
                <strong>{c.name}</strong>
                {c.description ? <span>{c.description}</span> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-lilac">{labels.charmsLoading}</p>
        )}
      </div>

      {finishes.length > 1 ? (
        <div>
          <p className="studio-birth-kicker">{labels.finishLabel}</p>
          <div className="studio-qty studio-qty-sm mt-3">
            {finishes.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  selectCharm(charm, f);
                  setFinish(f);
                }}
                className={`studio-qty-btn ${finish?.key === f.key ? 'is-on' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="studio-birth-kicker">{labels.czLabel}</p>
        <div className="studio-charm-row">
          {czOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setCzStyle(option.key)}
              className={`studio-charm-card ${czStyle === option.key ? 'is-on' : ''}`}
            >
              <OptionArt option={option} />
              <strong>{option.label}</strong>
              <span>{option.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="studio-birth-kicker">{labels.nameLabel}</p>
        <p className="mt-2 text-sm text-lilac">{labels.nameBody}</p>
        <input
          value={engravingName || ''}
          onChange={(e) => setEngravingName(e.target.value.slice(0, maxName))}
          maxLength={maxName}
          placeholder={labels.namePlaceholder}
          aria-label={labels.nameLabel}
          className="studio-name-input mt-3 w-full rounded-xl border border-gold/30 bg-surface px-3 py-2 text-ivory"
        />
      </div>
    </div>
  );
}
