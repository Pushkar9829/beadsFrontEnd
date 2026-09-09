import { useCustomizerStore } from '../../store/customizerStore';
import Price from '../ui/Price';

export default function NameStep() {
  const charms = useCustomizerStore((s) => s.charms);
  const charm = useCustomizerStore((s) => s.charm);
  const finish = useCustomizerStore((s) => s.finish);
  const selectCharm = useCustomizerStore((s) => s.selectCharm);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const config = useCustomizerStore((s) => s.config);
  const engravingName = useCustomizerStore((s) => s.engravingName);
  const setEngravingName = useCustomizerStore((s) => s.setEngravingName);
  const trimmed = engravingName.trim();
  const tooShort = engravingName.length > 0 && trimmed.length < 2;
  const finishes = charm?.finishes || [];

  return (
    <div className="studio-birth">
      <label className="studio-name-field">
        Engraved name
        <input
          value={engravingName}
          onChange={(e) => setEngravingName(e.target.value.slice(0, 32))}
          maxLength={32}
          placeholder="Aarav"
          autoComplete="given-name"
          spellCheck={false}
          className="studio-name-input"
        />
        <span className={`studio-name-hint ${tooShort ? 'is-warn' : ''}`}>
          {tooShort ? 'Use at least 2 letters.' : `${trimmed.length}/32`}
        </span>
      </label>

      {charms.length > 1 && (
        <div>
          <p className="studio-birth-kicker">Charm</p>
          <div className="studio-qty studio-qty-sm">
            {charms.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => selectCharm(c)}
                className={`studio-qty-btn ${charm?._id === c._id ? 'is-on' : ''}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="studio-birth-kicker">Finish</p>
        <div className="studio-finish-row">
          {finishes.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => selectCharm(charm, f)}
              className={`studio-finish-chip ${finish?.key === f.key ? 'is-on' : ''}`}
            >
              <span style={{ background: f.metalColor }} />
              {f.label}
              <Price value={f.price} />
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
