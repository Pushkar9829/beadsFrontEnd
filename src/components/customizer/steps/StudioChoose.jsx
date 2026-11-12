// Step 1 for the numerology, zodiac, planetary and profession paths (the purpose path
// starts with PurposePick).
//  - zodiac: "ZODIAC GRID PATH" cards (beeds_ecommerce StudioBuilderPage.jsx L531-633)
//  - planetary, profession: the source shows its purpose cards for these, so the same card is used
//  - numerology: frontend-only flow (date of birth, then Mulank/Bhagyank with each number's crystals),
//    in the step 3 cream look
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { useStudioLabels } from '../../../lib/studioTheme';
import { mediaUrl } from '../../../api/client';
import DateFields from '../DateFields';
import GemVisual from '../../ui/GemVisual';
import { formatInr } from '../../../lib/format';
import { PurposeCard } from './PurposePick';

function SignCard({ item, index, on, onClick }) {
  const initial = String(item.hindi || item.name || '?').charAt(0);
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className={`sb-card is-sign${on ? ' is-on' : ''}`}>
      {on && (
        <span className="sb-check" aria-hidden>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span className="sb-card-n">{String(index + 1).padStart(2, '0')}</span>
      <span className="sb-card-art" aria-hidden>
        {item.image ? <img src={mediaUrl(item.image)} alt="" /> : initial}
      </span>
      <span className="sb-card-t">{item.name}</span>
      {item.hindi && <span className="sb-card-hi">{item.hindi}</span>}
      <span className="sb-card-p">{[item.dates, item.theme].filter(Boolean).join(' · ') || item.description}</span>
    </button>
  );
}

function LayerPick() {
  const path = useCustomizerStore((s) => s.path);
  const items = useCustomizerStore((s) => s.layerItems);
  const loading = useCustomizerStore((s) => s.layerLoading);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const selectLayerItem = useCustomizerStore((s) => s.selectLayerItem);
  const goNext = useCustomizerStore((s) => s.goNext);
  const labels = useStudioLabels();

  // One pick is the whole step on these paths, so carry on without a Next click, as the
  // source does (kept out of the store action so a deep link never jumps forward).
  function pick(item) {
    selectLayerItem(item);
    goNext();
  }

  if (loading && !items.length) {
    return (
      <div className="sb-cards">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="sb-skel" />
        ))}
      </div>
    );
  }
  if (!items.length) return <p className="sb-empty">{labels.emptyLayer || 'No combinations in this catalog yet.'}</p>;

  return (
    <div className="sb-cards" role="radiogroup">
      {items.map((item, i) => {
        const on = layerItem?.slug === item.slug;
        return path === 'zodiac' ? (
          <SignCard key={item.slug} item={item} index={i} on={on} onClick={() => pick(item)} />
        ) : (
          <PurposeCard
            key={item.slug}
            purpose={{ ...item, description: item.description || [item.dates, item.theme].filter(Boolean).join(' · ') }}
            index={i}
            on={on}
            onClick={() => pick(item)}
          />
        );
      })}
    </div>
  );
}

// One number's card: the number, its theme, and the crystals that number puts on the strand
// (the numerology catalog's Mulank or Bhagyank slots for that number).
function NumberCard({ label, sub, value, items, slotKey }) {
  const item = items.find((it) => Number(it.number) === Number(value));
  const theme = item?.name || '';
  const beads = (item?.[slotKey] || []).filter((slot) => slot.available !== false && slot.bead);
  return (
    <article className="pbx">
      <div className="pbx-k">{label}</div>
      <div className="pbx-row">
        <span className="pbx-v">{value}</span>
      </div>
      <div className="pbx-sub">{sub}</div>
      {theme && <div className="pbx-why">{theme}</div>}
      {beads.length > 0 && (
        <ul className="pbx-beads" aria-label={`${label} crystals`}>
          {beads.map((slot) => (
            <li key={slot.bead._id || slot.name} className="pbx-bead">
              <GemVisual color={slot.bead.colorHex || '#C6A75E'} image={slot.bead.image} name="" className="pbx-gem" />
              <div className="pbx-bead-t">
                <div className="pbx-name">{slot.bead.name || slot.name}</div>
                {slot.bead.pricePerBead != null && <div className="pbx-price">{formatInr(slot.bead.pricePerBead)}/ bead</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// Numerology starts from the date of birth: Mulank and Bhagyank are read from it.
function NumerologyPick() {
  const items = useCustomizerStore((s) => s.layerItems);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const mulankNumber = useCustomizerStore((s) => s.mulankNumber);
  const bhagyankNumber = useCustomizerStore((s) => s.bhagyankNumber);
  const labels = useStudioLabels();

  return (
    <div>
      <section className="sb-box sb-dob">
        <div className="sb-ck">Your date of birth</div>
        <div className="sb-dob-p">Your Mulank and Bhagyank are read from this date, and each sets crystals for the strand.</div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </section>
      {dateOfBirth && (mulankNumber || bhagyankNumber) ? (
        <section className="sb-pb">
          <div className="sb-k">Your numbers</div>
          <div className="sb-nums">
            {mulankNumber ? <NumberCard label={labels.mulankLabel || 'Mulank'} sub="Your birth-day number" value={mulankNumber} items={items} slotKey="mulank" /> : null}
            {bhagyankNumber ? <NumberCard label={labels.bhagyankLabel || 'Bhagyank'} sub="Your full-date number" value={bhagyankNumber} items={items} slotKey="bhagyank" /> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function StudioChoose() {
  const path = useCustomizerStore((s) => s.path);
  return path === 'numerology' ? <NumerologyPick /> : <LayerPick />;
}
