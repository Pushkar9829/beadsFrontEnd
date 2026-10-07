// Crystal popup for the purpose studio (Nocturne). Same store actions and pricing as
// CrystalSelectModal, which the other studio paths still use.
import { useEffect, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { qtyOf } from '../../lib/studioFlow';
import { formatInr } from '../../lib/format';
import GemVisual from '../ui/GemVisual';
import { BEAD_COUNTS, priceForCount } from './CrystalSelectModal';

export default function NCrystalModal({ open, onClose, onComplete }) {
  const intention = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
  const quantities = useCustomizerStore((s) => s.quantities);
  const setIntentionBead = useCustomizerStore((s) => s.setIntentionBead);
  const setBeadQty = useCustomizerStore((s) => s.setBeadQty);
  const applyBeadCount = useCustomizerStore((s) => s.applyBeadCount);
  const addCatalogBead = useCustomizerStore((s) => s.addCatalogBead);
  const selecting = useCustomizerStore((s) => s.selecting);
  const stepError = useCustomizerStore((s) => s.stepError);
  const config = useCustomizerStore((s) => s.config);
  const finish = useCustomizerStore((s) => s.finish);
  const strandCount = useCustomizerStore((s) => s.strandCount) || 18;
  const quote = useCustomizerQuote();
  const [view, setView] = useState('pick');
  const [adding, setAdding] = useState(false);
  const picked = recommended.filter((b) => qtyOf(quantities, b._id) > 0);
  const placed = quote.beadCount || 0;
  const remaining = Math.max(0, strandCount - placed);
  const extras = (catalogBeads || []).filter((bead) => !recommended.some((r) => String(r._id) === String(bead._id)));
  const building = view === 'build';

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setView('pick');
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  function goBuild() {
    applyBeadCount(strandCount);
    setAdding(false);
    setView('build');
  }

  if (!open) return null;

  return (
    <div className="nx-cm-layer">
      <button type="button" className="nx-cm-scrim" aria-label="Close crystal selection" onClick={onClose} />
      <div className="nx-cm" role="dialog" aria-modal="true" aria-labelledby="nx-cm-title">
        <div className="nx-cm-head">
          <div className="nx-cm-head-row">
            <div className="min-w-0">
              <p className="nx-eb">{intention?.name || 'Intention'}</p>
              <h2 id="nx-cm-title" className="nx-cm-t">
                {building ? 'Build your bracelet' : 'Recommended crystals'}
              </h2>
            </div>
            <button type="button" className="nx-cm-x" onClick={onClose} aria-label="Close">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <ol className="nx-cm-tabs">
            <li>
              <button type="button" className={building ? '' : 'is-on'} onClick={() => setView('pick')}>
                <span>01</span> Crystals
              </button>
            </li>
            <li>
              <button type="button" className={building ? 'is-on' : ''} disabled={picked.length < 1 || selecting} onClick={goBuild}>
                <span>02</span> Strand
              </button>
            </li>
          </ol>
        </div>

        <div className="nx-cm-body">
          {stepError && <p className="nx-error nx-cm-msg">{stepError}</p>}

          {selecting && (
            <div className="nx-cm-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="nx-skel nx-cm-skel" />
              ))}
            </div>
          )}

          {!selecting && recommended.length === 0 && !stepError && <p className="nx-cm-empty">No crystals are mapped to this intention yet.</p>}

          {!selecting && recommended.length > 0 && !building && (
            <>
              <p className="nx-cm-lede">These are the traditional stones for this intention. All start on the strand; tap one to leave it out.</p>
              <div className="nx-cm-grid">
                {recommended.map((bead) => {
                  const on = qtyOf(quantities, bead._id) > 0;
                  return (
                    <button
                      key={bead._id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setIntentionBead(bead._id, !on)}
                      className={`nx-cm-tile${on ? ' is-on' : ''}`}
                    >
                      <span className="nx-cm-ph">
                        <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="nx-cm-img" />
                        <span className="nx-cm-mark" aria-hidden>
                          {on ? <Check size={13} strokeWidth={2.4} /> : <Plus size={13} strokeWidth={2} />}
                        </span>
                      </span>
                      <span className="nx-cm-name">{bead.name}</span>
                      <span className="nx-cm-price">{formatInr(bead.pricePerBead)} / bead</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!selecting && recommended.length > 0 && building && (
            <>
              <p className="nx-cm-label">Strand length</p>
              <div className="nx-cm-sizes" role="radiogroup" aria-label="Strand length">
                {BEAD_COUNTS.map((count) => {
                  const on = Number(strandCount) === count;
                  return (
                    <button key={count} type="button" role="radio" aria-checked={on} onClick={() => applyBeadCount(count)} className={on ? 'is-on' : ''}>
                      <b>{count} beads</b>
                      <span>{formatInr(priceForCount(count, recommended, quantities, config, finish, strandCount))}</span>
                    </button>
                  );
                })}
              </div>

              <div className="nx-cm-count">
                <p className="nx-cm-label">Beads on the strand</p>
                <p className={remaining ? 'is-short' : 'is-full'}>
                  {placed} of {strandCount}
                  {remaining ? ` · ${remaining} to place` : ' · complete'}
                </p>
              </div>
              <div className="nx-cm-bar" aria-hidden>
                <span style={{ width: `${Math.min(100, (placed / strandCount) * 100)}%` }} />
              </div>

              <ul className="nx-cm-lines">
                {picked.map((bead) => {
                  const qty = qtyOf(quantities, bead._id);
                  return (
                    <li key={bead._id}>
                      <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="nx-cm-dot" />
                      <span className="nx-cm-line-c">
                        <span className="nx-cm-name">{bead.name}</span>
                        <span className="nx-cm-price">
                          {formatInr(bead.pricePerBead)} / bead · {formatInr((bead.pricePerBead || 0) * qty)}
                        </span>
                      </span>
                      <span className="nx-qty nx-cm-qty" aria-label={`${bead.name} quantity`}>
                        <button type="button" aria-label={`One less ${bead.name}`} disabled={qty <= 1} onClick={() => setBeadQty(bead._id, qty - 1)}>
                          <Minus size={13} />
                        </button>
                        <span aria-live="polite">{qty}</span>
                        <button type="button" aria-label={`One more ${bead.name}`} disabled={remaining <= 0} onClick={() => setBeadQty(bead._id, qty + 1)}>
                          <Plus size={13} />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <button type="button" className="nx-cm-more" onClick={() => setAdding((v) => !v)} disabled={!extras.length} aria-expanded={adding}>
                <Plus size={14} strokeWidth={1.8} />
                {extras.length ? (adding ? 'Hide other crystals' : 'Add another crystal') : 'No other crystals available'}
              </button>

              {adding && extras.length > 0 && (
                <ul className="nx-cm-lines is-extra">
                  {extras.map((bead) => (
                    <li key={bead._id}>
                      <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="nx-cm-dot" />
                      <span className="nx-cm-line-c">
                        <span className="nx-cm-name">{bead.name}</span>
                        <span className="nx-cm-price">{formatInr(bead.pricePerBead)} / bead</span>
                      </span>
                      <button type="button" className="nx-cm-add" onClick={() => addCatalogBead(bead)}>
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="nx-cm-foot">
          <p className="nx-cm-sum">
            <span>{building ? `${placed} beads` : `${picked.length} of ${recommended.length} selected`}</span>
            {building && <b>{formatInr(quote.total)}</b>}
          </p>
          <div className="nx-cm-actions">
            {building ? (
              <>
                <button type="button" className="nx-btn nx-btn-o" onClick={() => setView('pick')}>
                  Back
                </button>
                <button type="button" className="nx-btn" onClick={onComplete || onClose} disabled={picked.length < 1}>
                  Use these crystals
                </button>
              </>
            ) : (
              <button type="button" className="nx-btn" onClick={goBuild} disabled={selecting || picked.length < 1}>
                {picked.length < 1 ? 'Select a crystal' : 'Next · build the strand'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
