import { Pencil } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { intentionEmoji } from '../../../lib/studioIcons';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../PurposeGrid';
import DateFields from '../DateFields';
import Spinner from '../../ui/Spinner';
import { studioText, useStudioLabels } from '../../../lib/studioTheme';

function ChosenPill({ label, detail, onChange }) {
  const labels = useStudioLabels();
  return (
    <div className="studio-chosen">
      <span className="studio-chosen-copy">
        <strong>{label}</strong>
        {detail ? <em>{detail}</em> : null}
      </span>
      <button type="button" onClick={onChange}>
        <Pencil size={13} strokeWidth={2.2} />
        {labels.changeLabel}
      </button>
    </div>
  );
}

function PurposeChoice() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const selectedIntentions = useCustomizerStore((s) => s.selectedIntentions);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);
  const toggleIntention = useCustomizerStore((s) => s.toggleIntention);
  const selecting = useCustomizerStore((s) => s.selecting);
  const clearSelection = useCustomizerStore((s) => s.clearSelection);
  const cap = Number(useCustomizerStore((s) => s.config?.intentionCap)) || 3;
  const labels = useStudioLabels();

  if (!purpose) {
    return (
      <div className="purpose-pick">
        {purposes.map((p) => (
          <button
            key={p._id}
            type="button"
            disabled={selecting}
            onClick={() => selectPurpose(p)}
            className="purpose-pick-card disabled:opacity-60"
            style={purposeToneStyle(p)}
          >
            <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
              <PurposeIcon purpose={p} />
            </span>
            <span className="purpose-pick-copy">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
            </span>
          </button>
        ))}
        {!purposes.length ? (
          <p className="sky-copy text-sm text-lilac">{labels.emptyPurposes}</p>
        ) : null}
      </div>
    );
  }

  const chosen = selectedIntentions || [];

  return (
    <div>
      <ChosenPill
        label={purpose.name}
        detail={purpose.description}
        onChange={clearSelection}
      />

      <div className="studio-pick-count mt-6">
        <span>{studioText(labels, 'intentionCount', { count: chosen.length, cap })}</span>
        <span>{studioText(labels, cap === 1 ? 'pickOne' : 'pickUpTo', { cap })}</span>
      </div>

      {selecting && !intentions.length ? <Spinner /> : null}

      <div className="purpose-pick mt-3">
        {intentions.map((it) => {
          const on = chosen.some((row) => String(row._id) === String(it._id));
          return (
            <button
              key={it._id}
              type="button"
              disabled={selecting}
              onClick={() => toggleIntention(it)}
              className={`purpose-pick-card disabled:opacity-60 ${on ? 'is-on' : ''}`}
              style={purposeToneStyle(it)}
            >
              <span className={`purpose-pick-emoji ${purposeHasImage(it) ? 'is-image' : 'is-plain'}`} aria-hidden>
                {purposeHasImage(it) ? <PurposeIcon purpose={it} /> : intentionEmoji(it)}
              </span>
              <span className="purpose-pick-copy">
                <h3>{it.name}</h3>
                <p>{it.description || (it.braceletName ? `Bracelet: ${it.braceletName}` : '')}</p>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// One tile shape for every path, matching the purpose grid: artwork in the well, the
// item's own label, then a single line of detail.
function PickCard({ item, label, detail, selected, numeral, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`purpose-pick-card ${selected ? 'is-on' : ''}`}
      style={purposeToneStyle(item)}
    >
      <span className={`purpose-pick-emoji ${purposeHasImage(item) ? 'is-image' : ''}`} aria-hidden>
        <PurposeIcon purpose={item} />
      </span>
      <span className="purpose-pick-copy">
        <h3 className={numeral ? 'is-numeral' : ''}>{label}</h3>
        {detail ? <p>{detail}</p> : null}
      </span>
    </button>
  );
}

function NumberGrid({ items, slotKey, active, onPick }) {
  return (
    <div className="purpose-pick mt-3">
      {items.map((item) => {
        const number = Number(item.number ?? item.slug);
        return (
          <PickCard
            key={`${slotKey}-${item.slug}`}
            item={item}
            label={number}
            detail={item.description || item.theme || item.name}
            selected={Number(active) === number}
            numeral
            onClick={() => onPick(number)}
          />
        );
      })}
    </div>
  );
}

function NumerologyChoice() {
  const items = useCustomizerStore((s) => s.layerItems);
  const loading = useCustomizerStore((s) => s.layerLoading);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const mulankNumber = useCustomizerStore((s) => s.mulankNumber);
  const bhagyankNumber = useCustomizerStore((s) => s.bhagyankNumber);
  const setNumerology = useCustomizerStore((s) => s.setNumerology);
  const labels = useStudioLabels();

  if (loading && !items.length) return <Spinner />;

  return (
    <div className="space-y-8">
      <div className="auth-card">
        <p className="studio-birth-kicker">{labels.birthKicker}</p>
        <p className="mt-2 text-sm text-lilac">{labels.birthBody}</p>
        <div className="mt-4">
          <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
        </div>
      </div>

      <div>
        <p className="studio-birth-kicker">{labels.mulankLabel}</p>
        <NumberGrid
          items={items}
          slotKey="mulank"
          active={mulankNumber}
          onPick={(n) => setNumerology({ mulank: mulankNumber === n ? null : n })}
        />
      </div>

      <div>
        <p className="studio-birth-kicker">{labels.bhagyankLabel}</p>
        <p className="mt-2 text-sm text-lilac">{labels.bhagyankBody}</p>
        <NumberGrid
          items={items}
          slotKey="bhagyank"
          active={bhagyankNumber}
          onPick={(n) => setNumerology({ bhagyank: bhagyankNumber === n ? null : n })}
        />
      </div>
    </div>
  );
}

function LayerChoice() {
  const items = useCustomizerStore((s) => s.layerItems);
  const loading = useCustomizerStore((s) => s.layerLoading);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const selectLayerItem = useCustomizerStore((s) => s.selectLayerItem);
  const goNext = useCustomizerStore((s) => s.goNext);
  const labels = useStudioLabels();

  // One pick is the whole step on these paths, so carry on without a Next click.
  // The advance lives here rather than in the action because syncFromUrl calls the
  // action too, and a deep link must not jump the customer forward.
  function pick(item) {
    selectLayerItem(item);
    goNext();
  }

  if (loading && !items.length) return <Spinner />;

  return (
    <div className="purpose-pick">
      {items.map((item) => (
        <PickCard
          key={item.slug}
          item={item}
          label={item.name}
          detail={item.description || [item.hindi, item.dates || item.theme].filter(Boolean).join(' · ')}
          selected={layerItem?.slug === item.slug}
          onClick={() => pick(item)}
        />
      ))}
      {!items.length ? (
        <p className="sky-copy text-sm text-lilac">{labels.emptyLayer}</p>
      ) : null}
    </div>
  );
}

export default function ChooseStep() {
  const path = useCustomizerStore((s) => s.path);
  if (path === 'purpose') return <PurposeChoice />;
  if (path === 'numerology') return <NumerologyChoice />;
  return <LayerChoice />;
}
