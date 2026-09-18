import { useCustomizerStore, useCustomizerQuote } from '../../../store/customizerStore';
import { parseWristInches } from '../../../lib/format';

function sameWrist(a, b) {
  return Boolean(a) && Boolean(b) && parseWristInches(a) === parseWristInches(b);
}

export default function FitStep() {
  const config = useCustomizerStore((s) => s.config);
  const beadSizeMm = useCustomizerStore((s) => s.beadSizeMm);
  const setBeadSizeMm = useCustomizerStore((s) => s.setBeadSizeMm);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const setWristSize = useCustomizerStore((s) => s.setWristSize);
  const threadType = useCustomizerStore((s) => s.threadType);
  const setThreadType = useCustomizerStore((s) => s.setThreadType);
  const goNext = useCustomizerStore((s) => s.goNext);
  const quote = useCustomizerQuote();
  const sizes = config?.beadSizesMm?.length ? config.beadSizesMm : [6, 8, 10];
  const wristSizes = config?.wristSizes || ['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'];
  const threads = config?.threadTypes?.length ? config.threadTypes : [
    { key: 'korean-elastic', label: 'Korean elastic thread', detail: 'Free-size fit' },
    { key: 'steel-core', label: 'Steel core thread', detail: 'Cut to your wrist size' },
  ];
  const currentThread = threads.find((t) => t.key === threadType) || threads[0];

  // Size and thread already have defaults, so a tap that only highlights feels dead.
  // Apply the pick, then continue; Back still returns here to change the others.
  function pickBead(mm) {
    setBeadSizeMm(mm);
    goNext();
  }

  function pickWrist(size) {
    setWristSize(size);
    goNext();
  }

  function pickThread(key) {
    setThreadType(key);
    goNext();
  }

  return (
    <div className="studio-birth space-y-7">
      <div>
        <p className="studio-birth-kicker">Bead size</p>
        <div className="studio-qty studio-qty-sm mt-3">
          {sizes.map((mm) => (
            <button
              key={mm}
              type="button"
              onClick={() => pickBead(mm)}
              className={`studio-qty-btn ${Number(beadSizeMm) === Number(mm) ? 'is-on' : ''}`}
            >
              {mm}mm
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="studio-birth-kicker">
          Wrist size{currentThread?.key === 'korean-elastic' ? ' · for bead count' : ''}
        </p>
        <div className="studio-qty studio-qty-sm mt-3">
          {wristSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => pickWrist(size)}
              className={`studio-qty-btn ${sameWrist(wristSize, size) ? 'is-on' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="studio-birth-kicker">Thread</p>
        <div className="studio-charm-row">
          {threads.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => pickThread(t.key)}
              className={`studio-charm-card ${threadType === t.key ? 'is-on' : ''}`}
            >
              <strong>{t.label}</strong>
              <span>{t.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-lilac">
        {quote.beadCount} beads of {beadSizeMm || 8}mm on a {wristSize || '6.5"'} wrist.
        {currentThread?.detail
          ? ` ${currentThread.detail}.`
          : ''}
      </p>
    </div>
  );
}
