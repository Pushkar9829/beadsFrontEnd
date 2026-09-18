import { useEffect, useMemo, useState } from 'react';
import { Check, Info, Plus, X } from 'lucide-react';
import { useCustomizerStore, useCrystalLimits } from '../../store/customizerStore';
import { qtyOf } from '../../lib/studioFlow';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';
import QtyControl from '../ui/QtyControl';

function CrystalRow({ bead, selected, qty, maxQty, onToggle, onQty, onInfo, roles }) {
  return (
    <div className={`studio-pick-row ${selected ? 'is-on' : ''}`}>
      <button
        type="button"
        className="studio-pick-main"
        onClick={onToggle}
        aria-pressed={selected}
      >
        <span className="studio-bead-box" aria-hidden>
          {selected ? <Check size={12} strokeWidth={3} /> : null}
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
          {roles?.length ? <span className="studio-pick-roles">{roles.join(' + ')}</span> : null}
        </span>
      </button>
      <div className="studio-pick-actions">
        {selected && onQty ? (
          <QtyControl value={qty} min={1} max={maxQty} onChange={onQty} />
        ) : null}
        <button
          type="button"
          className="studio-pick-info"
          onClick={onInfo}
          aria-label={`About ${bead.name}`}
        >
          <Info size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function CatalogModal({ extras, atMax, onAdd, onInfo, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-0 sm:place-items-center sm:p-6">
      <button
        type="button"
        className="studio-modal-scrim absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        aria-label="Close crystal catalog"
        onClick={onClose}
      />
      <div
        className="studio-modal bag-coupon-modal animate-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crystal-catalog-title"
      >
        <div className="studio-modal-bar flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Catalog</p>
            <h2 id="crystal-catalog-title" className="mt-1 font-serif text-xl gold-text">
              Add another crystal
            </h2>
          </div>
          <button type="button" className="header-icon" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {atMax ? (
            <p className="mb-3 text-sm text-lilac">
              The strand is at its crystal limit. Remove one from the list first to add another.
            </p>
          ) : null}
          <div className="studio-crystal-list">
            {extras.map((bead) => (
              <CrystalRow
                key={bead._id}
                bead={bead}
                selected={false}
                qty={0}
                onToggle={() => {
                  if (!atMax) onAdd(bead);
                }}
                onInfo={() => onInfo(bead)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrystalPicker() {
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const rolesById = useCustomizerStore((s) => s.rolesById);
  const catalogBeads = useCustomizerStore((s) => s.catalogBeads);
  const config = useCustomizerStore((s) => s.config);
  const toggleBead = useCustomizerStore((s) => s.toggleBead);
  const setBeadQty = useCustomizerStore((s) => s.setBeadQty);
  const addCatalogBead = useCustomizerStore((s) => s.addCatalogBead);
  const setDetailBead = useCustomizerStore((s) => s.setDetailBead);
  const limits = useCrystalLimits();
  const [adding, setAdding] = useState(false);
  const closeCatalog = () => setAdding(false);

  const beadTotal = useMemo(
    () => Object.values(quantities || {}).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [quantities]
  );
  const headroom = Math.max(0, (Number(config?.beadLimit) || 32) - beadTotal);

  const extras = useMemo(
    () =>
      (catalogBeads || []).filter(
        (bead) => !(recommended || []).some((row) => String(row._id) === String(bead._id))
      ),
    [catalogBeads, recommended]
  );

  if (!recommended?.length) {
    return (
      <p className="text-sm text-lilac">
        These crystals are not in the atelier yet. They need to be added under Beads first.
      </p>
    );
  }

  return (
    <div className="studio-birth">
      <div className="studio-pick-count">
        <span>
          {limits.count} of {limits.max} crystals
        </span>
        <span>{beadTotal} beads on the strand</span>
      </div>

      <div className="studio-crystal-list mt-4">
        {recommended.map((bead) => {
          const qty = qtyOf(quantities, bead._id);
          return (
            <CrystalRow
              key={bead._id}
              bead={bead}
              selected={qty > 0}
              qty={qty}
              maxQty={qty + headroom}
              roles={bead.roles || rolesById?.[String(bead._id)]}
              onToggle={() => toggleBead(bead._id)}
              onQty={(n) => setBeadQty(bead._id, n)}
              onInfo={() => setDetailBead(bead)}
            />
          );
        })}
      </div>

      {extras.length ? (
        <button
          type="button"
          className="studio-crystal-add"
          onClick={() => setAdding(true)}
        >
          <Plus size={16} strokeWidth={2.2} />
          Add another crystal
        </button>
      ) : null}

      {adding && extras.length ? (
        <CatalogModal
          extras={extras}
          atMax={limits.count >= limits.max}
          onAdd={addCatalogBead}
          onInfo={setDetailBead}
          onClose={closeCatalog}
        />
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-lilac">
        Traditional catalog associations, not medical claims.
      </p>
    </div>
  );
}
