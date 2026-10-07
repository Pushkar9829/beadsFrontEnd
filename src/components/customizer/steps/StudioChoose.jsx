// Step 1 for the numerology, zodiac, planetary and profession paths (the purpose path
// starts with PurposePick). Same store actions as the original ChooseStep.
import { Check } from 'lucide-react';
import { useCustomizerStore } from '../../../store/customizerStore';
import { bhagyankFromDate, mulankFromDate } from '../../../lib/calibration';
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

function NumberRow({ label, value, items, onPick, note }) {
  return (
    <div className="nx-numrow">
      <p className="nx-eb">{label}</p>
      {note && <p className="nx-birth-hint">{note}</p>}
      <div className="nx-nums" role="radiogroup" aria-label={label}>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} className={value === n ? 'is-on' : ''} onClick={() => onPick(value === n ? null : n)}>
            {n}
          </button>
        ))}
      </div>
      {value ? <p className="nx-numrow-t">{items.find((it) => Number(it.number) === Number(value))?.name || ''}</p> : null}
    </div>
  );
}

function NumerologyPick() {
  const items = useCustomizerStore((s) => s.layerItems);
  const dateOfBirth = useCustomizerStore((s) => s.dateOfBirth);
  const setDateOfBirth = useCustomizerStore((s) => s.setDateOfBirth);
  const mulankNumber = useCustomizerStore((s) => s.mulankNumber);
  const bhagyankNumber = useCustomizerStore((s) => s.bhagyankNumber);
  const setNumerology = useCustomizerStore((s) => s.setNumerology);
  const labels = useStudioLabels();
  let fromDate = null;
  try {
    if (dateOfBirth) fromDate = { mulank: mulankFromDate(dateOfBirth), bhagyank: bhagyankFromDate(dateOfBirth) };
  } catch {
    fromDate = null;
  }

  return (
    <div className="nx-birth">
      <section className="nx-birth-date">
        <div className="nx-birth-date-c">
          <p className="nx-eb">{labels.birthKicker || 'Date of birth · optional'}</p>
          <p className="nx-birth-hint">{labels.birthBody || 'Enter it and both numbers are filled in for you.'}</p>
        </div>
        <DateFields value={dateOfBirth} onChange={setDateOfBirth} />
        {fromDate && (
          <p className="nx-birth-hint nx-wrist-note">
            From your date: Mulank {fromDate.mulank}, Bhagyank {fromDate.bhagyank}.
          </p>
        )}
      </section>
      <section>
        <div className="nx-birth-head">
          <div>
            <p className="nx-eb">Or choose by hand</p>
            <p className="nx-birth-hint">Pick a Mulank, a Bhagyank, or both.</p>
          </div>
        </div>
        <div className="nx-numrows">
          <NumberRow label={labels.mulankLabel || 'Mulank'} value={mulankNumber} items={items} onPick={(n) => setNumerology({ mulank: n })} />
          <NumberRow label={labels.bhagyankLabel || 'Bhagyank'} note={labels.bhagyankBody} value={bhagyankNumber} items={items} onPick={(n) => setNumerology({ bhagyank: n })} />
        </div>
      </section>
    </div>
  );
}

export default function StudioChoose() {
  const path = useCustomizerStore((s) => s.path);
  return path === 'numerology' ? <NumerologyPick /> : <LayerPick />;
}
