// Step 1 for the numerology, zodiac, planetary and profession paths (the purpose path
// starts with PurposePick). Same store actions as the original ChooseStep.
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { useStudioLabels } from '../../../lib/studioTheme';
import { PurposeIcon, purposeToneStyle } from '../PurposeGrid';
import DateFields from '../DateFields';
import { mediaUrl } from '../../../api/client';

// Text presentation selector keeps these as symbols rather than colour emoji.
const T = '︎';
const SIGN_GLYPH = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};
const PLANET_GLYPH = { sun: '☉', moon: '☽', mars: '♂', mercury: '☿', jupiter: '♃', venus: '♀', saturn: '♄', rahu: '☊', ketu: '☋' };

function ItemArt({ item, path }) {
  if (item.image) return <img src={mediaUrl(item.image)} alt="" />;
  const glyph = path === 'zodiac' ? SIGN_GLYPH[item.slug] : path === 'planetary' ? PLANET_GLYPH[item.slug] : null;
  if (glyph) return <span className="nx-glyph">{glyph + T}</span>;
  return <PurposeIcon purpose={item} />;
}

function LayerPick() {
  const path = useCustomizerStore((s) => s.path);
  const items = useCustomizerStore((s) => s.layerItems);
  const loading = useCustomizerStore((s) => s.layerLoading);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const selectLayerItem = useCustomizerStore((s) => s.selectLayerItem);
  const goNext = useCustomizerStore((s) => s.goNext);
  const labels = useStudioLabels();
  const glyphs = path === 'zodiac' || path === 'planetary';

  // One pick is the whole step on these paths, so carry on without a Next click
  // (kept out of the store action so a deep link never jumps forward).
  function pick(item) {
    selectLayerItem(item);
    goNext();
  }

  if (loading && !items.length) {
    return (
      <div className="nx-ptiles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="nx-skel nx-ptile-skel" />
        ))}
      </div>
    );
  }
  if (!items.length) return <p className="nx-lede">{labels.emptyLayer || 'No combinations in this catalog yet.'}</p>;

  return (
    <div className="nx-ptiles" role="radiogroup">
      {items.map((item, i) => {
        const on = layerItem?.slug === item.slug;
        const art = item.image || !glyphs ? ' is-photo' : ' is-sym';
        return (
          <button key={item.slug} type="button" role="radio" aria-checked={on} onClick={() => pick(item)} className={`nx-ptile${on ? ' is-on' : ''}`} style={purposeToneStyle(item)}>
            <span className="nx-ptile-n">{String(i + 1).padStart(2, '0')}</span>
            {on && (
              <span className="nx-ptile-check" aria-hidden>
                <Check size={13} strokeWidth={2.4} />
              </span>
            )}
            <span className={`nx-ptile-art${art}`} aria-hidden>
              <ItemArt item={item} path={path} />
            </span>
            <span className="nx-ptile-h">{item.name}</span>
            {item.hindi && <span className="nx-ptile-hi">{item.hindi}</span>}
            <span className="nx-ptile-p">{item.description || [item.dates, item.theme].filter(Boolean).join(' · ')}</span>
          </button>
        );
      })}
    </div>
  );
}

function NumberCard({ label, sub, value, items }) {
  const theme = items.find((it) => Number(it.number) === Number(value))?.name || '';
  return (
    <article className="nx-pb is-read nx-numcard">
      <span className="nx-eb">{label}</span>
      <p className="nx-pb-v">{value}</p>
      <p className="nx-pb-sub">{sub}</p>
      {theme && <p className="nx-numrow-t">{theme}</p>}
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
    <div className="nx-birth">
      <section className="nx-birth-date">
        <div className="nx-birth-date-c">
          <p className="nx-eb">Your date of birth</p>
          <p className="nx-birth-hint">Your Mulank and Bhagyank are read from this date, and each sets crystals for the strand.</p>
        </div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
      </section>
      {dateOfBirth && (mulankNumber || bhagyankNumber) ? (
        <section>
          <p className="nx-eb nx-opt-label">Your numbers</p>
          <div className="nx-pbs is-2">
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
