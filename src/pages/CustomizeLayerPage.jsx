import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(null);
  const [selected, setSelected] = useState({});
  const [dob, setDob] = useState('');
  const [mulank, setMulank] = useState(null);
  const [bhagyank, setBhagyank] = useState(null);
  const [mulankOn, setMulankOn] = useState({});
  const [bhagyankOn, setBhagyankOn] = useState({});

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
    () => items.find((row) => Number(row.number) === Number(mulank)) || null,
    [items, mulank]
  );
  const bhagyankItem = useMemo(
    () => items.find((row) => Number(row.number) === Number(bhagyank)) || null,
    [items, bhagyank]
  );

  useEffect(() => {
    if (mulankItem) setMulankOn(defaultSelected(mulankItem.mulank));
  }, [mulankItem]);

  useEffect(() => {
    if (bhagyankItem) setBhagyankOn(defaultSelected(bhagyankItem.bhagyank));
  }, [bhagyankItem]);

  if (!LAYER_KINDS.has(kind)) return <Navigate to="/customize" replace />;

  function pickItem(item) {
    setPicked(item);
    setSelected(defaultSelected(item.recommended));
  }

  function toggle(map, setMap, id) {
    setMap({ ...map, [id]: !map[id] });
  }

  const recommendedSlots = picked?.recommended || [];
  const extraSlots = (picked?.suitable || []).filter(
    (slot) => !(picked?.recommended || []).some((core) => core.name === slot.name)
  );
  const availableCount = recommendedSlots.filter((s) => s.bead).length;
  const pickedCount = idsOf(recommendedSlots, selected).length;
  const minPick = Math.min(3, availableCount);
  const canContinueSimple = picked && pickedCount >= minPick && pickedCount <= 4;

  const mulankAvail = (mulankItem?.mulank || []).filter((s) => s.bead).length;
  const bhagyankAvail = (bhagyankItem?.bhagyank || []).filter((s) => s.bead).length;
  const mulankCount = idsOf(mulankItem?.mulank, mulankOn).length;
  const bhagyankCount = idsOf(bhagyankItem?.bhagyank, bhagyankOn).length;
  const mulankMin = Math.min(3, mulankAvail);
  const bhagyankMin = Math.min(3, bhagyankAvail);
  const mulankReady = Boolean(mulankItem) && mulankCount >= mulankMin && mulankCount <= 4;
  const bhagyankReady = Boolean(bhagyankItem) && bhagyankCount >= bhagyankMin && bhagyankCount <= 4;
  const canContinueNumerology =
    (mulankReady || bhagyankReady) &&
    (!mulankItem || mulankReady) &&
    (!bhagyankItem || bhagyankReady);

  function selectedNames(slots, map) {
    return (slots || [])
      .filter((slot) => slot.bead && map[String(slot.bead._id)])
      .map((slot) => slot.bead.name);
  }

  function rolesByBeadId() {
    const roles = {};
    const mark = (slots, map, role) => {
      (slots || []).forEach((slot) => {
        if (!slot.bead?._id || !map[String(slot.bead._id)]) return;
        const id = String(slot.bead._id);
        roles[id] = [...new Set([...(roles[id] || []), role])];
      });
    };
    if (mulankReady) mark(mulankItem.mulank, mulankOn, 'Mulank');
    if (bhagyankReady) mark(bhagyankItem.bhagyank, bhagyankOn, 'Bhagyank');
    return roles;
  }

  function continueSimple() {
    if (!canContinueSimple) return;
    applyLayer({
      kind,
      key: picked.slug,
      path: mode.path,
      modeLabel: MODE_LABELS[kind],
      name: picked.name,
      hindi: picked.hindi,
      theme: picked.theme,
      beads: uniqueBeads([...recommendedSlots, ...extraSlots], selected),
      layerSelections: kind === 'zodiac'
        ? {
            zodiac: {
              sign: picked.name,
              hindi: picked.hindi,
              recommended: selectedNames(recommendedSlots, selected),
              suitable: selectedNames(extraSlots, selected),
            },
          }
        : undefined,
    });
    navigate(`/customize?layer=${kind}&key=${picked.slug}`);
  }

  function continueNumerology() {
    if (!canContinueNumerology) return;
    const seen = new Set();
    const beads = [
      ...(mulankReady ? uniqueBeads(mulankItem.mulank, mulankOn) : []),
      ...(bhagyankReady ? uniqueBeads(bhagyankItem.bhagyank, bhagyankOn) : []),
    ].filter((bead) => {
      const id = String(bead._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const m = mulankReady ? mulankItem.number : null;
    const b = bhagyankReady ? bhagyankItem.number : null;
    const key = m && b ? `${m}-${b}` : m ? `m${m}` : `b${b}`;
    const name = [m ? `Mulank ${m}` : '', b ? `Bhagyank ${b}` : ''].filter(Boolean).join(' · ');
    applyLayer({
      kind: 'numerology',
      key,
      path: mode.path,
      modeLabel: MODE_LABELS.numerology,
      name,
      theme: [mulankReady ? mulankItem.theme : '', bhagyankReady && b !== m ? bhagyankItem.theme : '']
        .filter(Boolean)
        .join(' · '),
      beads,
      dateOfBirth: dob,
      mulank: m,
      bhagyank: b,
      rolesById: rolesByBeadId(),
      layerSelections: {
        mulank: mulankReady
          ? { number: m, beads: selectedNames(mulankItem.mulank, mulankOn) }
          : null,
        bhagyank: bhagyankReady
          ? { number: b, beads: selectedNames(bhagyankItem.bhagyank, bhagyankOn) }
          : null,
      },
    });
    const q = new URLSearchParams({ layer: 'numerology', key });
    if (m) q.set('mulank', String(m));
    if (b) q.set('bhagyank', String(b));
    if (dob) q.set('dob', dob);
    navigate(`/customize?${q.toString()}`);
  }

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
        ) : error ? (
          <p className="mt-8 text-sm text-red-300">{error}</p>
        ) : kind === 'numerology' ? (
          <div className="mt-8 space-y-8">
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
                {items.map((item) => (
                  <button
                    key={`m-${item.slug}`}
                    type="button"
                    onClick={() => setMulank(Number(mulank) === item.number ? null : item.number)}
                    className={`layer-pick-card ${Number(mulank) === item.number ? 'is-on' : ''}`}
                  >
                    <span className="layer-pick-kicker">Number</span>
                    <h3>{item.number}</h3>
                    <p>{item.theme}</p>
                  </button>
                ))}
              </div>
              {mulankItem && (
                <div className="mt-4">
                  <p className="text-sm text-lilac">Choose any 3 or all 4 Mulank crystals. This layer can stand alone.</p>
                  <BeadToggles
                    slots={mulankItem.mulank}
                    selected={mulankOn}
                    onToggle={(id) => toggle(mulankOn, setMulankOn, id)}
                  />
                </div>
              )}
            </div>

            <div>
              <p className="studio-birth-kicker">Bhagyank</p>
              <div className="layer-pick mt-3">
                {items.map((item) => (
                  <button
                    key={`b-${item.slug}`}
                    type="button"
                    onClick={() => setBhagyank(Number(bhagyank) === item.number ? null : item.number)}
                    className={`layer-pick-card ${Number(bhagyank) === item.number ? 'is-on' : ''}`}
                  >
                    <span className="layer-pick-kicker">Number</span>
                    <h3>{item.number}</h3>
                    <p>{item.theme}</p>
                  </button>
                ))}
              </div>
              {bhagyankItem && (
                <div className="mt-4">
                  <p className="text-sm text-lilac">Choose any 3 or all 4 Bhagyank crystals. Shared stones with Mulank stay once in the strand.</p>
                  <BeadToggles
                    slots={bhagyankItem.bhagyank}
                    selected={bhagyankOn}
                    onToggle={(id) => toggle(bhagyankOn, setBhagyankOn, id)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-lilac">
                Traditional catalog associations, not medical claims.
              </p>
              <Button onClick={continueNumerology} disabled={!canContinueNumerology}>
                Continue in studio
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="layer-pick">
              {items.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => pickItem(item)}
                  className={`layer-pick-card ${picked?.slug === item.slug ? 'is-on' : ''}`}
                >
                  {item.hindi ? <span className="layer-pick-kicker">{item.hindi}</span> : null}
                  <h3>{item.name}</h3>
                  {item.dates ? <p>{item.dates}</p> : <p>{item.theme}</p>}
                </button>
              ))}
            </div>

            {picked && (
              <div className="mt-8 space-y-4">
                <div>
                  <p className="studio-birth-kicker">{picked.name}</p>
                  <p className="mt-2 text-sm text-lilac">{picked.theme}</p>
                  <p className="mt-1 text-sm text-lilac">{picked.rule || 'Keep any 3 or all 4 recommended crystals, then finish charm and review in the studio.'}</p>
                </div>
                <BeadToggles
                  slots={recommendedSlots}
                  selected={selected}
                  onToggle={(id) => toggle(selected, setSelected, id)}
                />
                {kind === 'zodiac' && extraSlots.length ? (
                  <div>
                    <p className="studio-birth-kicker">Also suitable</p>
                    <p className="mt-1 text-sm text-lilac">Optional catalog stones for this sign. They merge into the strand after the recommended core.</p>
                    <BeadToggles
                      slots={extraSlots.map((slot) => ({ ...slot, core: false }))}
                      selected={selected}
                      onToggle={(id) => toggle(selected, setSelected, id)}
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-lilac">Traditional catalog associations, not medical claims.</p>
                  <Button onClick={continueSimple} disabled={!canContinueSimple}>
                    Continue in studio
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
