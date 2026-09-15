import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import GemVisual from '../components/ui/GemVisual';
import StudioModeNav from '../components/customizer/StudioModeNav';
import { DateOfBirthFields } from '../components/customizer/BirthDateStep';
import { studioMode } from '../lib/studioModes';
import { mulankFromDate, bhagyankFromDate } from '../lib/calibration';
import { useCustomizerStore } from '../store/customizerStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

const LAYER_KINDS = new Set(['numerology', 'zodiac', 'planetary', 'profession']);
const MODE_LABELS = {
  numerology: 'Customise by numerology',
  zodiac: 'Customise by zodiac sign',
  planetary: 'Customise by planetary',
  profession: 'Customise by profession',
};

function itemNumber(item) {
  const n = Number(item?.number ?? item?.slug);
  return Number.isFinite(n) ? n : null;
}

function slotNames(slots) {
  return (slots || []).map((slot) => slot.name).filter(Boolean).join(' · ');
}

function cardTitle(item) {
  const name = String(item?.name || '').trim();
  if (!name || /^number\s*\d+$/i.test(name)) return item?.theme || '';
  return name;
}

function idsOf(slots, selected) {
  return (slots || [])
    .map((slot) => slot.bead?._id)
    .filter((id) => id && selected[String(id)]);
}

function uniqueBeads(slots, selected) {
  const seen = new Set();
  const beads = [];
  (slots || []).forEach((slot) => {
    const bead = slot.bead;
    if (!bead?._id || !selected[String(bead._id)]) return;
    const id = String(bead._id);
    if (seen.has(id)) return;
    seen.add(id);
    beads.push(bead);
  });
  return beads;
}

function defaultSelected(slots) {
  const next = {};
  (slots || []).forEach((slot) => {
    if (slot.bead?._id) next[String(slot.bead._id)] = true;
  });
  return next;
}

function BeadToggles({ slots, selected, onToggle }) {
  return (
    <div className="layer-beads">
      {(slots || []).map((slot) => {
        const bead = slot.bead;
        const on = bead ? Boolean(selected[String(bead._id)]) : false;
        return (
          <button
            key={slot.name}
            type="button"
            disabled={!bead}
            onClick={() => bead && onToggle(String(bead._id))}
            className={`layer-bead ${on ? 'is-on' : ''} ${bead ? '' : 'is-off'}`}
          >
            {bead ? (
              <GemVisual color={bead.colorHex} image={bead.image} name={bead.name} className="layer-bead-gem" />
            ) : (
              <span className="layer-bead-gem is-empty" />
            )}
            <span>
              <strong>{slot.name}</strong>
              <em>{bead ? bead.shortDescriptor : 'Not in the atelier yet'}</em>
              {slot.shared ? <span className="layer-bead-flag">Shared</span> : null}
              {slot.core === false ? <span className="layer-bead-flag">Suitable</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function CustomizeLayerPage() {
  const { kind } = useParams();
  const navigate = useNavigate();
  const brand = useBrand();
  const mode = studioMode(kind);
  const init = useCustomizerStore((s) => s.init);
  const applyLayer = useCustomizerStore((s) => s.applyLayer);
  const ready = useCustomizerStore((s) => s.ready);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(null);
  const [selected, setSelected] = useState({});
  const [dob, setDob] = useState('');
  const [mulank, setMulank] = useState(null);
  const [bhagyank, setBhagyank] = useState(null);
  const [mulankOn, setMulankOn] = useState({});
  const [bhagyankOn, setBhagyankOn] = useState({});
  const detailRef = useRef(null);

  const load = useCallback(() => {
    if (!LAYER_KINDS.has(kind)) return;
    setLoading(true);
    api
      .get(`/customizer/layers/${kind}`)
      .then(({ data }) => setItems(data.items || []))
      .catch((e) => setError(e.message || 'Could not load this path.'))
      .finally(() => setLoading(false));
  }, [kind]);

  useRefreshOnView(load);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setPicked(null);
    setSelected({});
    setDob('');
    setMulank(null);
    setBhagyank(null);
    setMulankOn({});
    setBhagyankOn({});
    setError('');
    setBusy(false);
  }, [kind]);

  useEffect(() => {
    if (!dob) return;
    try {
      setMulank(mulankFromDate(dob));
      setBhagyank(bhagyankFromDate(dob));
    } catch {
      /* incomplete date */
    }
  }, [dob]);

  const mulankItem = useMemo(
    () =>
      items.find(
        (row) => itemNumber(row) === Number(mulank) || String(row.slug) === String(mulank)
      ) || null,
    [items, mulank]
  );
  const bhagyankItem = useMemo(
    () =>
      items.find(
        (row) => itemNumber(row) === Number(bhagyank) || String(row.slug) === String(bhagyank)
      ) || null,
    [items, bhagyank]
  );

  useEffect(() => {
    if (mulankItem) setMulankOn(defaultSelected(mulankItem.mulank));
  }, [mulankItem]);

  useEffect(() => {
    if (bhagyankItem) setBhagyankOn(defaultSelected(bhagyankItem.bhagyank));
  }, [bhagyankItem]);

  useEffect(() => {
    if (!picked && !mulankItem && !bhagyankItem) return;
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [picked, mulankItem, bhagyankItem]);

  if (!LAYER_KINDS.has(kind)) return <Navigate to="/customize" replace />;

  function toggle(map, setMap, id) {
    setMap({ ...map, [id]: !map[id] });
  }

  const recommendedSlots = picked?.recommended || [];
  const extraSlots = (picked?.suitable || []).filter(
    (slot) => !(picked?.recommended || []).some((core) => core.name === slot.name)
  );
  const availableCount = recommendedSlots.filter((s) => s.bead).length;
  const pickedCount = idsOf(recommendedSlots, selected).length;
  const minPick = Math.min(3, availableCount) || (availableCount > 0 ? availableCount : 0);
  const canContinueSimple = Boolean(picked) && availableCount > 0 && pickedCount >= minPick && pickedCount <= 4;

  function selectedMap(slots, map) {
    if (map && Object.values(map).some(Boolean)) return map;
    return defaultSelected(slots);
  }

  function selectedNames(slots, map) {
    const on = selectedMap(slots, map);
    return (slots || [])
      .filter((slot) => slot.bead && on[String(slot.bead._id)])
      .map((slot) => slot.bead.name);
  }

  const mulankMap = selectedMap(mulankItem?.mulank, mulankOn);
  const bhagyankMap = selectedMap(bhagyankItem?.bhagyank, bhagyankOn);
  const mulankReady = Boolean(mulankItem) && uniqueBeads(mulankItem.mulank, mulankMap).length > 0;
  const bhagyankReady = Boolean(bhagyankItem) && uniqueBeads(bhagyankItem.bhagyank, bhagyankMap).length > 0;
  const canContinueNumerology = mulankReady || bhagyankReady;

  function rolesByBeadId(mItem, mMap, bItem, bMap) {
    const roles = {};
    const mark = (slots, map, role) => {
      (slots || []).forEach((slot) => {
        if (!slot.bead?._id || !map[String(slot.bead._id)]) return;
        const id = String(slot.bead._id);
        roles[id] = [...new Set([...(roles[id] || []), role])];
      });
    };
    if (mItem) mark(mItem.mulank, mMap, 'Mulank');
    if (bItem) mark(bItem.bhagyank, bMap, 'Bhagyank');
    return roles;
  }

  async function ensureStudio() {
    if (!ready) await init();
  }

  async function goToStudio(item, selectedMap) {
    const rec = item?.recommended || [];
    const extras = (item?.suitable || []).filter(
      (slot) => !rec.some((core) => core.name === slot.name)
    );
    const map = selectedMap || defaultSelected(rec);
    const beads = uniqueBeads([...rec, ...extras], map);
    if (!beads.length) {
      setPicked(item);
      setSelected(map);
      setError('These crystals are not in the atelier yet. They need to be added under Beads first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await ensureStudio();
      applyLayer({
        kind,
        key: item.slug,
        path: mode.path,
        modeLabel: MODE_LABELS[kind],
        name: item.name,
        hindi: item.hindi,
        theme: item.theme,
        beads,
        layerSelections: kind === 'zodiac'
          ? {
              zodiac: {
                sign: item.name,
                hindi: item.hindi,
                recommended: selectedNames(rec, map),
                suitable: selectedNames(extras, map),
              },
            }
          : undefined,
      });
      navigate(`/customize?layer=${kind}&key=${encodeURIComponent(item.slug)}`);
    } catch (e) {
      setBusy(false);
      setError(e.message || 'Could not open the studio.');
    }
  }

  function pickItem(item) {
    const map = defaultSelected(item.recommended);
    setPicked(item);
    setSelected(map);
    setError('');
    goToStudio(item, map);
  }

  async function continueNumerology() {
    if (busy) return;
    const mItem = mulankItem;
    const bItem = bhagyankItem;
    const mMap = selectedMap(mItem?.mulank, mulankOn);
    const bMap = selectedMap(bItem?.bhagyank, bhagyankOn);
    const mBeads = mItem ? uniqueBeads(mItem.mulank, mMap) : [];
    const bBeads = bItem ? uniqueBeads(bItem.bhagyank, bMap) : [];
    const seen = new Set();
    const beads = [...mBeads, ...bBeads].filter((bead) => {
      const id = String(bead._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    if (!beads.length) {
      setError(
        mItem || bItem
          ? 'These crystals are not in the atelier yet. They need to be added under Beads first.'
          : 'Choose a Mulank or Bhagyank combination to continue.'
      );
      return;
    }
    const m = mBeads.length ? itemNumber(mItem) : null;
    const b = bBeads.length ? itemNumber(bItem) : null;
    const key = m && b ? `${m}-${b}` : m ? `m${m}` : `b${b}`;
    const name = [m ? mItem.theme : '', b ? bItem.theme : '']
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(' · ');
    setBusy(true);
    setError('');
    try {
      await ensureStudio();
      applyLayer({
        kind: 'numerology',
        key,
        path: mode.path,
        modeLabel: MODE_LABELS.numerology,
        name,
        theme: [m ? mItem.theme : '', b && b !== m ? bItem.theme : ''].filter(Boolean).join(' · '),
        beads,
        dateOfBirth: dob,
        mulank: m,
        bhagyank: b,
        rolesById: rolesByBeadId(m ? mItem : null, mMap, b ? bItem : null, bMap),
        layerSelections: {
          mulank: m ? { number: m, beads: selectedNames(mItem.mulank, mMap) } : null,
          bhagyank: b ? { number: b, beads: selectedNames(bItem.bhagyank, bMap) } : null,
        },
      });
      const q = new URLSearchParams({ layer: 'numerology', key });
      if (m) q.set('mulank', String(m));
      if (b) q.set('bhagyank', String(b));
      if (dob) q.set('dob', dob);
      navigate(`/customize?${q.toString()}`);
    } catch (e) {
      setBusy(false);
      setError(e.message || 'Could not open the studio.');
    }
  }

  function pickMulank(item) {
    setMulank(itemNumber(item) ?? item.slug);
    setMulankOn(defaultSelected(item.mulank));
    setError('');
  }

  function pickBhagyank(item) {
    setBhagyank(itemNumber(item) ?? item.slug);
    setBhagyankOn(defaultSelected(item.bhagyank));
    setError('');
  }

  const numerologyContinueBar =
    mulankItem || bhagyankItem ? (
      <div className="layer-continue">
        <p className="text-xs text-lilac">
          {mulankReady && bhagyankReady
            ? 'Mulank and Bhagyank are set. Continue opens charm and review.'
            : mulankReady
              ? 'Mulank is set. Add Bhagyank below, or continue with this layer only.'
              : 'Bhagyank is set. Add Mulank above, or continue with this layer only.'}
        </p>
        <Button onClick={continueNumerology} disabled={!canContinueNumerology || busy}>
          {busy ? 'Opening…' : 'Continue to charm'}
        </Button>
      </div>
    ) : null;

  return (
    <div className="relative">
      <SeoHead
        title={pageTitle(mode.title, brand)}
        description={mode.body}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage}
        noIndex={brand.seo?.noIndex}
      />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: brand.nav.customize, to: '/customize' },
            { label: mode.short },
          ]}
        />
        <div className="mt-8">
          <SectionHead eyebrow={mode.eyebrow} title={mode.title} body={mode.body} />
        </div>
        <StudioModeNav />

        {loading ? (
          <Spinner />
        ) : error && !items.length ? (
          <p className="mt-8 text-sm text-red-300">{error}</p>
        ) : kind === 'numerology' ? (
          <div className="mt-8 space-y-8 pb-8">
            <div className="auth-card">
              <p className="studio-birth-kicker">Optional date of birth</p>
              <p className="mt-2 text-sm text-lilac">
                Mulank is the birth-day number. Bhagyank is the full-date number. Use one layer or both. Matching stones stay once, with both roles kept.
              </p>
              <div className="mt-4">
                <DateOfBirthFields value={dob} onChange={setDob} />
              </div>
            </div>

            <div>
              <p className="studio-birth-kicker">Mulank</p>
              <div className="layer-pick mt-3">
                {items.map((item) => {
                  const n = itemNumber(item);
                  return (
                    <button
                      key={`m-${item.slug}`}
                      type="button"
                      onClick={() => pickMulank(item)}
                      className={`layer-pick-card ${Number(mulank) === n ? 'is-on' : ''}`}
                    >
                      <h3>{item.theme || cardTitle(item)}</h3>
                      <p>{slotNames(item.mulank)}</p>
                    </button>
                  );
                })}
              </div>
              {mulankItem && (
                <div ref={detailRef} className="mt-4">
                  <p className="text-sm text-lilac">Choose any 3 or all 4 Mulank crystals. This layer can stand alone.</p>
                  <BeadToggles
                    slots={mulankItem.mulank}
                    selected={mulankMap}
                    onToggle={(id) => toggle(mulankMap, setMulankOn, id)}
                  />
                  {numerologyContinueBar}
                </div>
              )}
            </div>

            <div>
              <p className="studio-birth-kicker">Bhagyank</p>
              <div className="layer-pick mt-3">
                {items.map((item) => {
                  const n = itemNumber(item);
                  return (
                    <button
                      key={`b-${item.slug}`}
                      type="button"
                      onClick={() => pickBhagyank(item)}
                      className={`layer-pick-card ${Number(bhagyank) === n ? 'is-on' : ''}`}
                    >
                      <h3>{item.theme || cardTitle(item)}</h3>
                      <p>{slotNames(item.bhagyank)}</p>
                    </button>
                  );
                })}
              </div>
              {bhagyankItem && (
                <div className="mt-4">
                  <p className="text-sm text-lilac">Choose any 3 or all 4 Bhagyank crystals. Shared stones with Mulank stay once in the strand.</p>
                  <BeadToggles
                    slots={bhagyankItem.bhagyank}
                    selected={bhagyankMap}
                    onToggle={(id) => toggle(bhagyankMap, setBhagyankOn, id)}
                  />
                  {numerologyContinueBar}
                </div>
              )}
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <p className="text-xs text-lilac">Traditional catalog associations, not medical claims.</p>
          </div>
        ) : (
          <div className="mt-8 pb-8">
            <div className="layer-pick">
              {items.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  disabled={busy}
                  onClick={() => pickItem(item)}
                  className={`layer-pick-card ${picked?.slug === item.slug ? 'is-on' : ''}`}
                >
                  {item.hindi ? <span className="layer-pick-kicker">{item.hindi}</span> : null}
                  <h3>{item.name}</h3>
                  {item.dates ? <p>{item.dates}</p> : <p>{item.theme}</p>}
                </button>
              ))}
            </div>
            {!items.length ? <p className="mt-6 text-sm text-lilac">No combinations in this catalog yet.</p> : null}
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            {picked && !busy && !canContinueSimple ? (
              <div ref={detailRef} className="mt-8 space-y-4">
                <div>
                  <p className="studio-birth-kicker">{picked.name}</p>
                  <p className="mt-2 text-sm text-lilac">{picked.theme}</p>
                  <p className="mt-1 text-sm text-lilac">{picked.rule}</p>
                </div>
                <BeadToggles
                  slots={recommendedSlots}
                  selected={selected}
                  onToggle={(id) => toggle(selected, setSelected, id)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
