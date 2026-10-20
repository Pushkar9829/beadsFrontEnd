// Charm step for every studio path, beeds_ecommerce StudioBuilderPage.jsx "STEP 4: CHARM AND THREAD"
// (L1496-1676): charm at the clasp and the thread (glyphs as the source: ≈ elastic, ◎ steel core).
// Finish and wrist size are frontend-only data rows. Classes: styles/atelier/studio-charm.css.
import { Check } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../../store/customizerStore';
import { mediaUrl } from '../../../api/client';
import { formatInr } from '../../../lib/format';
import { useStudioLabels } from '../../../lib/studioTheme';

// Charms ship without artwork, so known ones get a drawn mark and the rest their initial.
function CharmMark({ charm }) {
  if (charm.image) return <img src={mediaUrl(charm.image)} alt="" />;
  const key = `${charm.slug || ''} ${charm.name || ''}`.toLowerCase();
  if (key.includes('om')) return <span lang="sa">ॐ</span>;
  if (key.includes('yantra')) return <span>✡</span>;
  return <span>{String(charm.name || '?').charAt(0)}</span>;
}

export default function StudioCharm() {
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
    <div>
      <section className="sb-charm-sec">
        <div className="sb-k">{labels.charmLabel || 'Charm at the clasp'}</div>
        <div className="sb-hint">One charm sits at the clasp of every strand.</div>
        {!charms.length ? (
          <p className="sb-empty">{labels.charmsLoading || 'Charms are loading.'}</p>
        ) : (
          <div className="sb-opts" role="radiogroup" aria-label="Charm">
            {charms.map((c) => {
              const on = String(charm?._id) === String(c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectCharm(c, finish?.key ? c.finishes?.find((f) => f.key === finish.key) : undefined)}
                  className={`sb-opt${on ? ' is-on' : ''}`}
                >
                  {on && (
                    <span className="sb-check" aria-hidden>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <span className="sb-opt-art">
                    <CharmMark charm={c} />
                  </span>
                  <span className="sb-opt-t">{c.name}</span>
                  {c.description && <span className="sb-opt-p">{c.description}</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {finishes.length > 1 && (
        <section className="sb-finish">
          <div className="sb-k">{labels.finishLabel || 'Finish'}</div>
          <div className="sb-chips" role="radiogroup" aria-label="Finish">
            {finishes.map((row) => (
              <button key={row.key} type="button" role="radio" aria-checked={finish?.key === row.key} onClick={() => setFinish(row)} className={finish?.key === row.key ? 'is-on' : ''}>
                {row.metalColor && <i style={{ '--sb-metal': row.metalColor }} />}
                {row.label || row.key}
                {row.price ? <em>+{formatInr(row.price)}</em> : null}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="sb-k">{labels.threadLabel || 'Thread'}</div>
        <div className="sb-hint">Elastic slips on at any size; steel core is cut to your wrist size.</div>
        <div className="sb-opts is-threads" role="radiogroup" aria-label="Thread">
          {threads.map((t) => {
            const on = threadType === t.key;
            return (
              <button key={t.key} type="button" role="radio" aria-checked={on} onClick={() => setThreadType(t.key)} className={`sb-opt is-row${on ? ' is-on' : ''}`}>
                {on && (
                  <span className="sb-check" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                <span className="sb-opt-art">{t.key === 'steel-core' ? '◎' : '≈'}</span>
                <span>
                  <span className="sb-opt-t">{t.label}</span>
                  {t.detail && <span className="sb-opt-p">{t.detail}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {steel && (
          <div className="sb-wrist">
            <div className="sb-k">{labels.wristLabel || 'Wrist size'}</div>
            <div className="sb-hint">Measure around your wrist with a soft tape and pick the nearest size.</div>
            <div className="sb-chips" role="radiogroup" aria-label="Wrist size">
              {wristSizes.map((size) => (
                <button key={size} type="button" role="radio" aria-checked={wristSize === size} onClick={() => setWristSize(size)} className={wristSize === size ? 'is-on' : ''}>
                  {size}
                </button>
              ))}
            </div>
            {wristSize && quote.beadCount ? (
              <div className="sb-hint sb-wrist-note">
                Steel core is cut to fit, so a {wristSize} wrist takes {quote.beadCount} beads. The live price includes them.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
