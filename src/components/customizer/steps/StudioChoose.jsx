// Step 1 for the numerology, zodiac, planetary and profession paths (the purpose path
// starts with PurposePick).
//  - zodiac: "ZODIAC GRID PATH" cards (beeds_ecommerce StudioBuilderPage.jsx L531-633)
//  - planetary, profession: the source shows its purpose cards for these, so the same card is used
//  - numerology: frontend-only flow (date of birth, then Mulank/Bhagyank), in the step 3 cream look
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { useStudioLabels } from '../../../lib/studioTheme';
import { mediaUrl } from '../../../api/client';
import DateFields from '../DateFields';
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
      <span className="sb-sign" aria-hidden>
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

function NumberCard({ label, sub, value, items }) {
  const theme = items.find((it) => Number(it.number) === Number(value))?.name || '';
  return (
    <article className="pbx">
      <div className="pbx-k">{label}</div>
      <div className="pbx-row">
        <span className="pbx-v">{value}</span>
      </div>
      <div className="pbx-sub">{sub}</div>
      {theme && <div className="pbx-why">{theme}</div>}
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
            {mulankNumber ? <NumberCard label={labels.mulankLabel || 'Mulank'} sub="Your birth-day number" value={mulankNumber} items={items} /> : null}
            {bhagyankNumber ? <NumberCard label={labels.bhagyankLabel || 'Bhagyank'} sub="Your full-date number" value={bhagyankNumber} items={items} /> : null}
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
