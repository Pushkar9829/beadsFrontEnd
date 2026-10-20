// Crystal popup used by every studio path: pick the recommended stones, then build the
// strand (length, counts, extra crystals from the catalog).
import { useEffect, useState } from 'react';
import { CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { qtyOf } from '../../lib/studioFlow';
import { formatInr } from '../../lib/format';
import GemVisual from '../ui/GemVisual';
import { quoteFromBeads } from '../../lib/calibration';

const BEAD_COUNTS = [16, 18, 22];

function priceOf(beads, quantities, config, finish) {
  return quoteFromBeads(
    config,
    (beads || []).map((bead) => ({ ...bead, quantity: qtyOf(quantities, bead._id) })),
    finish
  ).beadsTotal;
}

function evenSplit(ids, total) {
  const keys = [...new Set((ids || []).map((id) => String(id)).filter(Boolean))];
  if (!keys.length || total <= 0) return {};
  const base = Math.floor(total / keys.length);
  let rem = total % keys.length;
  const next = {};
  keys.forEach((id) => {
    next[id] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
  });
  return next;
}

function priceForCount(count, beads, quantities, config, finish, currentCount) {
  if (Number(count) === Number(currentCount)) {
    return priceOf(beads, quantities, config, finish);
  }
  const selected = (beads || []).filter((bead) => qtyOf(quantities, bead._id) > 0);
  const pool = selected.length ? selected : beads;
  const next = {};
  (beads || []).forEach((bead) => {
    next[String(bead._id)] = 0;
  });
  Object.assign(next, evenSplit(pool.map((bead) => bead._id), count));
  return priceOf(beads, next, config, finish);
}

export default function CrystalModal({ open, onClose, onComplete }) {
  const intention = useCustomizerStore((s) => s.intention);
  const purpose = useCustomizerStore((s) => s.purpose);
  const layer = useCustomizerStore((s) => s.layer);
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
  const [offerIds, setOfferIds] = useState([]);
  const picked = recommended.filter((b) => qtyOf(quantities, b._id) > 0);
  const placed = quote.beadCount || 0;
  const remaining = Math.max(0, strandCount - placed);
  const over = Math.max(0, placed - strandCount);
  const extras = (catalogBeads || []).filter((bead) => !recommended.some((r) => String(r._id) === String(bead._id)));
  // The picker keeps showing a crystal after it is added (marked "Added") instead of
  // dropping it from the list mid-click.
  const offer = (catalogBeads || []).filter((bead) => offerIds.includes(String(bead._id)));
  const isAdded = (bead) => recommended.some((r) => String(r._id) === String(bead._id));
  const addedCount = offer.filter(isAdded).length;

  function openPicker() {
    setOfferIds(extras.map((bead) => String(bead._id)));
    setView('catalog');
  }
  // Views, as in the source popup: 'pick' (recommended crystals), 'build' (strand), 'catalog' (add another).
  const building = view === 'build';
  const cataloging = view === 'catalog';

  useEffect(() => {
    if (!open) {
      setView('pick');
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (cataloging) setView('build');
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, cataloging]);

  function goBuild() {
    applyBeadCount(strandCount);
    setView('build');
  }

  if (!open) return null;

  const eyebrow = building
    ? [purpose?.name, intention?.name || layer?.name].filter(Boolean).join(' / ')
    : cataloging
      ? 'Catalog'
      : intention?.name || layer?.name || 'Your crystals';

  return (
    <div className="cmx-layer">
      <button type="button" className="cmx-scrim" aria-label="Close crystal selection" onClick={onClose} />
      <div className={`cmx${building ? ' is-build' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cmx-title">
        <div className={`cmx-head${building ? ' is-build' : ''}`}>
          <button type="button" className={building ? 'cmx-x-plain' : 'cmx-x'} onClick={onClose} aria-label="Close">
            <X size={building ? 18 : 15} strokeWidth={building ? 2.2 : 2} />
          </button>
          <div className="cmx-eb">{eyebrow}</div>
          <h2 id="cmx-title" className={building ? 'cmx-t-serif' : 'cmx-t'}>
            {building ? 'Build your bracelet' : cataloging ? 'Add another crystal' : 'Recommended crystals'}
          </h2>
          <p className={building ? 'cmx-sub' : 'cmx-lede'}>
            {building
              ? `Choose ${BEAD_COUNTS.slice(0, -1).join(', ')}, or ${BEAD_COUNTS[BEAD_COUNTS.length - 1]} beads, then set how many of each crystal.`
              : cataloging
                ? 'Each one joins the strand with a single bead. Adjust the counts afterwards.'
                : 'These are the traditional stones for your choice. All start on the strand; tap one to leave it out.'}
          </p>
          {building && <div className="cmx-rule" />}
        </div>

        {stepError && <p className="cmx-msg">{stepError}</p>}

        {/* View 1: recommended crystals */}
        {!building && !cataloging && (
          <div className="cmx-body">
            {selecting ? (
              <div className="cmx-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="cmx-skel" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              !stepError && <p className="cmx-empty">No crystals are mapped to this intention yet.</p>
            ) : (
              <div className="cmx-grid">
                {recommended.map((bead) => {
                  const on = qtyOf(quantities, bead._id) > 0;
                  return (
                    <button
                      key={bead._id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setIntentionBead(bead._id, !on)}
                      className={`cmx-tile${on ? ' is-on' : ''}`}
                    >
                      <span className="cmx-ph">
                        <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="cmx-img" />
                        {!on && (
                          <span className="cmx-removed">
                            <span>Removed</span>
                          </span>
                        )}
                      </span>
                      <span className="cmx-name">{bead.name}</span>
                      <span className="cmx-price">{formatInr(bead.pricePerBead)} / bead</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: build the strand */}
        {building && (
          <div className="cmx-body is-scroll">
            <div className="cmx-sizes" role="radiogroup" aria-label="Strand length">
              {BEAD_COUNTS.map((count) => {
                const on = Number(strandCount) === count;
                return (
                  <button key={count} type="button" role="radio" aria-checked={on} onClick={() => applyBeadCount(count)} className={`cmx-size${on ? ' is-on' : ''}`}>
                    <b>{count} beads</b>
                    <span>{formatInr(priceForCount(count, recommended, quantities, config, finish, strandCount))}</span>
                  </button>
                );
              })}
            </div>

            <div className="cmx-label-row">
              <span className="cmx-label">
                <CheckCircle2 size={16} strokeWidth={2.2} /> Select crystals (recommended)
              </span>
              <span className={`cmx-count${over ? ' is-over' : remaining ? '' : ' is-full'}`}>
                {placed} of {strandCount}
                {over ? ` · ${over} over` : remaining ? ` · ${remaining} to place` : ''}
              </span>
            </div>

            <div className="cmx-lines">
              {picked.map((bead) => {
                const qty = qtyOf(quantities, bead._id);
                return (
                  <div key={bead._id} className="cmx-line">
                    <div className="cmx-line-l">
                      <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="cmx-dot" />
                      <div>
                        <div className="cmx-line-name">{bead.name}</div>
                        <div className="cmx-line-price">
                          {formatInr((bead.pricePerBead || 0) * qty)} · {formatInr(bead.pricePerBead)} / bead
                        </div>
                      </div>
                    </div>
                    <div className="cmx-stepper" aria-label={`${bead.name} quantity`}>
                      <button type="button" aria-label={`One less ${bead.name}`} disabled={qty <= 1} onClick={() => setBeadQty(bead._id, qty - 1)}>
                        <Minus size={13} strokeWidth={2.2} />
                      </button>
                      <span aria-live="polite">{qty}</span>
                      <button type="button" aria-label={`One more ${bead.name}`} disabled={remaining <= 0} onClick={() => setBeadQty(bead._id, qty + 1)}>
                        <Plus size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className="cmx-addmore" onClick={openPicker} disabled={!extras.length}>
              <Plus size={14} strokeWidth={2.5} />
              <span>{extras.length ? 'Add more crystals' : 'No other crystals'}</span>
            </button>
          </div>
        )}

        {/* View 3: catalog (add another crystal) */}
        {cataloging && (
          <div className="cmx-body is-catalog">
            <div className="cmx-grid is-catalog">
              {offer.map((bead) => {
                const added = isAdded(bead);
                return (
                  <button
                    key={bead._id}
                    type="button"
                    disabled={added}
                    onClick={() => addCatalogBead(bead)}
                    className={`cmx-tile is-catalog${added ? ' is-added' : ''}`}
                    aria-label={added ? `${bead.name} added` : `Add ${bead.name}`}
                  >
                    <span className="cmx-ph">
                      <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="cmx-img" />
                      <span className="cmx-plus" aria-hidden>
                        <Plus size={11} strokeWidth={2.5} />
                      </span>
                    </span>
                    <span className="cmx-name">{bead.name}</span>
                    <span className="cmx-price">{added ? 'Added to the strand' : `${formatInr(bead.pricePerBead)} / bead`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="cmx-foot">
          {building ? (
            <>
              <button type="button" className="cmx-back" onClick={() => setView('pick')}>
                Back
              </button>
              <button type="button" className="cmx-use" onClick={onComplete || onClose} disabled={picked.length < 1}>
                Use these crystals
              </button>
            </>
          ) : cataloging ? (
            <>
              <span className="cmx-sum is-catalog">{addedCount ? `${addedCount} added` : 'Tap a crystal to add it'}</span>
              <button type="button" className="cmx-gold is-catalog" onClick={() => setView('build')}>
                {addedCount ? 'Done' : 'Close'}
              </button>
            </>
          ) : (
            <>
              <span className="cmx-sum">
                {picked.length} of {recommended.length} selected
              </span>
              <button type="button" className="cmx-gold" onClick={goBuild} disabled={selecting || picked.length < 1}>
                {picked.length < 1 ? 'Select a crystal' : 'Next · build the strand'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
