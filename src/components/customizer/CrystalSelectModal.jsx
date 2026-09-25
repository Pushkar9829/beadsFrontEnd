import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useCustomizerStore, useCustomizerQuote } from '../../store/customizerStore';
import { qtyOf } from '../../lib/studioFlow';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';
import Button from '../ui/Button';
import QtyControl from '../ui/QtyControl';
import { purposeToneStyle } from './PurposeGrid';

const BEAD_COUNTS = [16, 18, 22];

function estimateForCount(count, beads, quantities, config, finish) {
  const selected = beads.filter((b) => qtyOf(quantities, b._id) > 0);
  const pool = selected.length ? selected : beads;
  const making = (config?.baseMakingPrice || 0) + (finish?.price || 0);
  if (!pool.length) return making;
  const avg = pool.reduce((sum, b) => sum + (b.pricePerBead || 0), 0) / pool.length;
  return making + Math.round(avg * count);
}

export default function CrystalSelectModal({ open, onClose, onComplete }) {
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
  const purpose = useCustomizerStore((s) => s.purpose);
  const strandCount = useCustomizerStore((s) => s.strandCount);
  const purposeTone = purpose ? purposeToneStyle(purpose) : undefined;
  const quote = useCustomizerQuote();
  const [view, setView] = useState('pick');
  const [adding, setAdding] = useState(false);
  const picked = recommended.filter((b) => qtyOf(quantities, b._id) > 0);
  const remaining = Math.max(0, (strandCount || 18) - (quote.beadCount || 0));
  const extras = (catalogBeads || []).filter(
    (bead) => !recommended.some((r) => String(r._id) === String(bead._id))
  );
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
    applyBeadCount(strandCount || 18);
    setAdding(false);
    setView('build');
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[55] grid place-items-end p-0 sm:place-items-center sm:p-6${purposeTone ? ' has-purpose-tone studio-modal-layer' : ''}`}
      style={purposeTone}
    >
      <button
        type="button"
        aria-label="Close crystal selection"
        className="studio-modal-scrim absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        onClick={onClose}
      />
      <div className="studio-modal animate-overlay" role="dialog" aria-modal="true" aria-labelledby="crystal-modal-title">
        <div className="studio-modal-bar flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
              {intention?.name || 'Intention'}
            </p>
            <h2 id="crystal-modal-title" className="font-serif text-xl gold-text">
              {building ? 'Build your bracelet' : 'Recommended crystals'}
            </h2>
            <p className="mt-1 text-sm text-lilac">
              {building
                ? 'Choose 16, 18, or 22 beads, then set how many of each crystal.'
                : 'Select or unselect the recommended crystals.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lilac transition hover:bg-gold/10 hover:text-ivory"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {selecting && (
            <p className="py-8 text-center text-sm text-lilac">Selecting crystals…</p>
          )}

          {stepError && <p className="mb-4 text-sm text-red-300">{stepError}</p>}

          {!selecting && recommended.length === 0 && !stepError && (
            <p className="py-8 text-center text-sm text-lilac">No crystals are mapped to this intention yet.</p>
          )}

          {!selecting && recommended.length > 0 && !building && (
            <div className="studio-crystal-grid">
              {recommended.map((bead) => {
                const on = qtyOf(quantities, bead._id) > 0;
                return (
                  <button
                    key={bead._id}
                    type="button"
                    onClick={() => setIntentionBead(bead._id, !on)}
                    className={`studio-crystal-tile ${on ? 'is-on' : ''}`}
                  >
                    <span className="studio-crystal-tile-top">
                      <span className="studio-bead-box" aria-hidden>
                        {on ? <Check size={11} strokeWidth={3.5} color="#0b0b0d" /> : null}
                      </span>
                      <span className="studio-bead-label">{on ? 'Unselect' : 'Select'}</span>
                    </span>
                    <GemVisual
                      color={bead.colorHex}
                      image={bead.image}
                      name={bead.name}
                      className="studio-crystal-tile-gem"
                    />
                    <span className="studio-crystal-copy">
                      <span className="studio-bead-name">{bead.name}</span>
                      <span className="studio-bead-price">
                        <Price value={bead.pricePerBead} /> / bead
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!selecting && recommended.length > 0 && building && (
            <>
              <div className="studio-size-row">
                {BEAD_COUNTS.map((count) => {
                  const on = Number(strandCount) === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => applyBeadCount(count)}
                      className={`studio-size-card ${on ? 'is-on' : ''}`}
                    >
                      <span className="studio-size-count">{count} beads</span>
                      <span className="studio-size-price">
                        <Price value={estimateForCount(count, recommended, quantities, config, finish)} />
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="studio-crystal-head">
                <span className="studio-crystal-head-mark" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                Select crystals (Recommended)
              </p>

              <div className="studio-crystal-list">
                {picked.map((bead) => {
                  const qty = qtyOf(quantities, bead._id);
                  return (
                    <div key={bead._id} className="studio-crystal is-on">
                      <GemVisual
                        color={bead.colorHex}
                        image={bead.image}
                        name={bead.name}
                        className="studio-crystal-gem"
                      />
                      <div className="studio-crystal-copy">
                        <p className="studio-bead-name">{bead.name}</p>
                        <p className="studio-bead-price">
                          <Price value={bead.pricePerBead} /> / bead
                        </p>
                      </div>
                      <QtyControl
                        value={qty}
                        min={1}
                        max={qty + remaining}
                        onChange={(n) => setBeadQty(bead._id, n)}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="studio-crystal-add"
                onClick={() => setAdding((v) => !v)}
                disabled={!extras.length}
              >
                <Plus size={16} strokeWidth={2.2} />
                {extras.length ? 'Add more crystals' : 'No more crystals'}
              </button>

              {adding && extras.length > 0 && (
                <div className="studio-crystal-list mt-3">
                  {extras.map((bead) => (
                    <button
                      key={bead._id}
                      type="button"
                      className="studio-crystal"
                      onClick={() => addCatalogBead(bead)}
                    >
                      <span className="studio-bead-box" aria-hidden>
                        <Plus size={12} strokeWidth={3} />
                      </span>
                      <GemVisual
                        color={bead.colorHex}
                        image={bead.image}
                        name={bead.name}
                        className="studio-crystal-gem"
                      />
                      <span className="studio-crystal-copy">
                        <span className="studio-bead-name">{bead.name}</span>
                        <span className="studio-bead-price">
                          <Price value={bead.pricePerBead} /> / bead
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="studio-modal-bar flex shrink-0 items-center justify-between gap-3 border-t border-[rgba(198,167,94,0.2)] px-5 py-4">
          {building ? (
            <>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.16em] text-lilac"
                onClick={() => setView('pick')}
              >
                Back
              </button>
              <Button onClick={onComplete || onClose} disabled={picked.length < 1}>
                Use these crystals
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.16em] text-lilac">
                {picked.length} selected
              </p>
              <Button onClick={goBuild} disabled={selecting || picked.length < 1}>
                {picked.length < 1 ? 'Select a crystal' : 'Build your bracelet'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
