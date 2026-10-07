// Step 4 of the purpose path: charm at the clasp, its finish, the thread and (for steel
// core) the wrist size. Same store actions as CharmStep, which the other paths still use.
import { Check } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../../store/customizerStore';
import { mediaUrl } from '../../../api/client';
import { formatInr } from '../../../lib/format';
import { useStudioLabels } from '../../../lib/studioTheme';

// Charms ship without artwork, so known ones get a drawn mark and the rest their initial.
function CharmMark({ charm }) {
  if (charm.image) return <img src={mediaUrl(charm.image)} alt="" />;
  const key = `${charm.slug || ''} ${charm.name || ''}`.toLowerCase();
  if (key.includes('om')) return <span className="nx-charm-glyph" lang="sa">ॐ</span>;
  if (key.includes('yantra')) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
        <circle cx="32" cy="32" r="27" />
        <path d="M32 12 L50 43 H14 Z" />
        <path d="M32 52 L14 21 H50 Z" />
        <path d="M32 21 L42 38 H22 Z" />
        <circle cx="32" cy="32" r="1.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return <span className="nx-charm-glyph">{String(charm.name || '?').charAt(0)}</span>;
}

function ThreadMark({ steel }) {
  return steel ? (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <circle cx="32" cy="32" r="18" />
      <circle cx="32" cy="32" r="14" strokeDasharray="2 3" />
      <path d="M46 20 L52 14" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
      <path d="M14 32 C20 22 26 42 32 32 C38 22 44 42 50 32" />
      <path d="M14 40 C20 30 26 50 32 40 C38 30 44 50 50 40" opacity="0.5" />
    </svg>
  );
}

export default function PurposeCharm() {
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
  const quote = useCustomizerQuote();
  const finishes = charm?.finishes || [];
  const threads = config?.threadTypes?.length
    ? config.threadTypes
    : [
        { key: 'korean-elastic', label: 'Korean elastic thread', detail: 'Free-size fit' },
        { key: 'steel-core', label: 'Steel core thread', detail: 'Cut to your wrist size' },
      ];
  const wristSizes = config?.wristSizes || ['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'];
  const steel = threadType === 'steel-core';

  return (
    <div className="nx-birth">
      <section>
        <div className="nx-birth-head">
          <div>
            <p className="nx-eb">{labels.charmLabel || 'Charm at the clasp'}</p>
            <p className="nx-birth-hint">One charm sits at the clasp of every strand.</p>
          </div>
        </div>
        {!charms.length ? (
          <p className="nx-birth-hint">{labels.charmsLoading || 'Charms are loading.'}</p>
        ) : (
          <div className="nx-opts is-charms" role="radiogroup" aria-label="Charm">
            {charms.map((c) => {
              const on = String(charm?._id) === String(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectCharm(c, finish?.key ? c.finishes?.find((f) => f.key === finish.key) : undefined)}
                  className={`nx-opt${on ? ' is-on' : ''}`}
                >
                  {on && (
                    <span className="nx-ptile-check" aria-hidden>
                      <Check size={13} strokeWidth={2.4} />
                    </span>
                  )}
                  <span className="nx-opt-art">
                    <CharmMark charm={c} />
                  </span>
                  <span className="nx-opt-h">{c.name}</span>
                  {c.description && <span className="nx-opt-p">{c.description}</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {finishes.length > 1 && (
        <section>
          <p className="nx-eb nx-opt-label">{labels.finishLabel || 'Finish'}</p>
          <div className="nx-chips-pick" role="radiogroup" aria-label="Finish">
            {finishes.map((row) => (
              <button key={row.key} type="button" role="radio" aria-checked={finish?.key === row.key} onClick={() => setFinish(row)} className={finish?.key === row.key ? 'is-on' : ''}>
                {row.metalColor && <i style={{ background: row.metalColor }} />}
                {row.label || row.key}
                {row.price ? <em>+{formatInr(row.price)}</em> : null}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="nx-birth-head">
          <div>
            <p className="nx-eb">{labels.threadLabel || 'Thread'}</p>
            <p className="nx-birth-hint">Elastic slips on at any size; steel core is cut to your wrist.</p>
          </div>
        </div>
        <div className="nx-opts is-threads" role="radiogroup" aria-label="Thread">
          {threads.map((t) => {
            const on = threadType === t.key;
            return (
              <button key={t.key} type="button" role="radio" aria-checked={on} onClick={() => setThreadType(t.key)} className={`nx-opt is-row${on ? ' is-on' : ''}`}>
                {on && (
                  <span className="nx-ptile-check" aria-hidden>
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                )}
                <span className="nx-opt-art is-small">
                  <ThreadMark steel={t.key === 'steel-core'} />
                </span>
                <span>
                  <span className="nx-opt-h">{t.label}</span>
                  {t.detail && <span className="nx-opt-p">{t.detail}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {steel && (
          <div className="nx-wrist">
            <p className="nx-eb nx-opt-label">{labels.wristLabel || 'Wrist size'}</p>
            <p className="nx-birth-hint">Measure around your wrist with a soft tape and pick the nearest size.</p>
            <div className="nx-chips-pick" role="radiogroup" aria-label="Wrist size">
              {wristSizes.map((size) => (
                <button key={size} type="button" role="radio" aria-checked={wristSize === size} onClick={() => setWristSize(size)} className={wristSize === size ? 'is-on' : ''}>
                  {size}
                </button>
              ))}
            </div>
            {wristSize && quote.beadCount ? (
              <p className="nx-birth-hint nx-wrist-note">
                Steel core is cut to fit, so a {wristSize} wrist takes {quote.beadCount} beads. The live price includes them.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
