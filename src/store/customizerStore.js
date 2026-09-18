import { useMemo } from 'react';
import { create } from 'zustand';
import api from '../api/client';
import { quoteFromBeads, bhagyankFromDate, mulankFromDate } from '../lib/calibration';
import { formatWristChoice, strandBeadCount } from '../lib/format';
import { studioMode, studioPaths } from '../lib/studioModes';
import {
  REVIEW_STEP,
  STEP_COUNT,
  crystalLimits,
  isLayerPath,
  qtyOf,
  stepAt,
} from '../lib/studioFlow';

export { qtyOf };

function modeLabelOf(path, config) {
  return studioMode(path, config).label;
}

function idOf(value) {
  return value == null ? '' : String(value);
}

function uniqueById(beads) {
  const seen = new Set();
  const out = [];
  (beads || []).forEach((bead) => {
    const id = idOf(bead?._id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(bead);
  });
  return out;
}

function distributeQty(ids, total) {
  const keys = [...new Set((ids || []).map(idOf).filter(Boolean))];
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

function strandSize(state) {
  const count = strandBeadCount(
    state.wristSize || state.config?.defaultWristSize,
    state.beadSizeMm || state.config?.defaultBeadSizeMm || 8,
    { min: Number(state.config?.minBeads) || 8, max: Number(state.config?.beadLimit) || 32 }
  );
  return Math.min(count, Number(state.config?.beadLimit) || 32);
}

// Beads that carry a slot, keeping the first occurrence of duplicates across layers.
function beadsFromSlots(slots) {
  return uniqueById((slots || []).map((slot) => slot.bead).filter(Boolean));
}

function itemNumber(item) {
  const n = Number(item?.number ?? item?.slug);
  return Number.isFinite(n) ? n : null;
}

function findByNumber(items, number) {
  if (number == null) return null;
  return (
    (items || []).find(
      (item) => itemNumber(item) === Number(number) || String(item.slug) === String(number)
    ) || null
  );
}

function joinThemes(values) {
  return [...new Set((values || []).filter(Boolean))].join(' · ');
}

// The purpose and layer paths keep different selection state, so `layer`, `intention`
// and `calibration` are recomputed from it here rather than being set by hand in each
// action. Everything downstream (review, preview, cart payload) reads only these.
function deriveSelection(state) {
  const { path } = state;
  if (path === 'purpose') {
    const primary = (state.selectedIntentions || [])[0] || null;
    return { layer: null, intention: primary, calibration: null };
  }

  const mode = studioMode(path, state.config);
  const modeLabel = modeLabelOf(path, state.config);

  if (path === 'numerology') {
    const mItem = findByNumber(state.layerItems, state.mulankNumber);
    const bItem = findByNumber(state.layerItems, state.bhagyankNumber);
    if (!mItem && !bItem) return { layer: null, intention: null, calibration: null };
    const m = mItem ? itemNumber(mItem) : null;
    const b = bItem ? itemNumber(bItem) : null;
    const key = m && b ? `${m}-${b}` : m ? `m${m}` : `b${b}`;
    const name = joinThemes([mItem?.theme, bItem?.theme]);
    const selections = {
      mulank: mItem ? { number: m, beads: selectedSlotNames(mItem.mulank, state.quantities) } : null,
      bhagyank: bItem
        ? { number: b, beads: selectedSlotNames(bItem.bhagyank, state.quantities) }
        : null,
    };
    const layer = {
      kind: 'numerology',
      key,
      path: mode.path,
      modeLabel,
      name,
      theme: name,
      mulank: m,
      bhagyank: b,
      rolesById: state.rolesById || {},
      selections,
    };
    return {
      layer,
      intention: { name, slug: key },
      calibration: {
        dateOfBirth: state.dateOfBirth || '',
        mulank: m,
        bhagyank: b,
        layerSelections: selections,
        explanation: name
          ? `${name}. Traditional catalog associations, not medical claims.`
          : '',
      },
    };
  }

  const item = state.layerItem;
  if (!item) return { layer: null, intention: null, calibration: null };
  const coreNames = new Set((item.recommended || []).map((slot) => slot.name));
  const extraSlots = (item.suitable || []).filter((slot) => !coreNames.has(slot.name));
  const selections =
    path === 'zodiac'
      ? {
          zodiac: {
            sign: item.name,
            hindi: item.hindi,
            recommended: selectedSlotNames(item.recommended, state.quantities),
            suitable: selectedSlotNames(extraSlots, state.quantities),
          },
        }
      : {
          [path]: {
            name: item.name,
            hindi: item.hindi,
            recommended: selectedSlotNames(item.recommended, state.quantities),
            extras: selectedSlotNames(extraSlots, state.quantities),
          },
        };
  const layer = {
    kind: path,
    key: item.slug,
    path: mode.path,
    modeLabel,
    name: item.name,
    hindi: item.hindi,
    theme: item.theme,
    rolesById: {},
    selections,
  };
  return {
    layer,
    intention: { name: item.name, slug: item.slug },
    calibration: {
      zodiac: path === 'zodiac' ? { sign: item.name } : undefined,
      layerSelections: selections,
      explanation: item.theme
        ? `${item.name}: ${item.theme}. Traditional catalog associations, not medical claims.`
        : '',
    },
  };
}

function selectedSlotNames(slots, quantities) {
  return (slots || [])
    .filter((slot) => slot.bead && qtyOf(quantities, slot.bead._id) > 0)
    .map((slot) => slot.bead.name);
}

export function selectCanAdvance(state) {
  if (state.step >= REVIEW_STEP) return false;
  return Boolean(stepAt(state.step).validate(state));
}

export function selectStepHint(state) {
  const entry = stepAt(state.step);
  return entry.validate(state) ? '' : entry.hint(state) || '';
}

// Derived objects must not be produced inside a store selector: Zustand caches the
// snapshot by identity, so a fresh object each call loops forever. Subscribe to the
// stable slices instead and memoize, the same way useCustomizerQuote does.
export function useCrystalLimits() {
  const path = useCustomizerStore((s) => s.path);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  return useMemo(
    () => crystalLimits({ path, recommended, quantities }),
    [path, recommended, quantities]
  );
}

// Canonical query string for the current selection, so the build stays shareable.
export function selectUrlQuery(state) {
  const q = new URLSearchParams({ path: state.path });
  if (state.path === 'purpose') {
    if (state.purpose?.slug) q.set('purpose', state.purpose.slug);
  } else if (state.path === 'numerology') {
    if (state.dateOfBirth) q.set('dob', state.dateOfBirth);
    if (state.mulankNumber) q.set('mulank', String(state.mulankNumber));
    if (state.bhagyankNumber) q.set('bhagyank', String(state.bhagyankNumber));
  } else if (state.layerItem?.slug) {
    q.set('key', state.layerItem.slug);
  }
  return q.toString();
}

const SELECTION_DEFAULTS = {
  purpose: null,
  intentions: [],
  selectedIntentions: [],
  layerItem: null,
  mulankNumber: null,
  bhagyankNumber: null,
  dateOfBirth: '',
  recommended: [],
  quantities: {},
  rolesById: {},
  layer: null,
  intention: null,
  calibration: null,
  stepError: '',
};

export const useCustomizerStore = create((set, get) => ({
  step: 1,
  path: 'purpose',
  config: null,
  purposes: [],
  charms: [],
  catalogBeads: [],
  layerItems: [],
  layerKindLoaded: '',

  ...SELECTION_DEFAULTS,

  charm: null,
  finish: null,
  wristSize: '6.5"',
  beadSizeMm: 8,
  czStyle: 'cz',
  threadType: 'korean-elastic',
  engravingName: '',

  detailBead: null,
  previewOpen: false,
  loading: false,
  ready: false,
  advancing: false,
  selecting: false,
  layerLoading: false,
  // Number of syncFromUrl hydrations in flight. The page must not mirror state back into
  // the address bar while any are running, or it would rewrite the URL from the selection
  // still being replaced. A count rather than a flag because switching paths quickly can
  // overlap two hydrations, and the first to finish must not clear the second's guard.
  urlSyncing: 0,
  error: null,

  async init() {
    const boot = !get().ready;
    if (boot) set({ loading: true, error: null });
    try {
      const [cfg, pur, ch, beads] = await Promise.all([
        api.get('/customizer/config'),
        api.get('/customizer/purposes'),
        api.get('/customizer/charms'),
        api.get('/customizer/beads').catch(() => ({ data: { beads: [] } })),
      ]);
      const purposes = pur.data.purposes || [];
      const charms = ch.data.charms || [];
      const current = get();
      const purpose = current.purpose
        ? purposes.find((p) => p._id === current.purpose._id || p.slug === current.purpose.slug) ||
          current.purpose
        : null;
      const charm = charms.find((c) => c._id === current.charm?._id) || current.charm || charms[0] || null;
      const finish =
        charm?.finishes?.find((f) => f.key === current.finish?.key) ||
        current.finish ||
        charm?.finishes?.[0] ||
        null;
      set({
        config: cfg.data.config,
        purposes,
        charms,
        catalogBeads: beads.data.beads || [],
        purpose,
        charm,
        finish,
        wristSize:
          current.wristSize && current.wristSize !== 'Free size'
            ? current.wristSize
            : cfg.data.config?.defaultWristSize || '6.5"',
        beadSizeMm: current.beadSizeMm || cfg.data.config?.defaultBeadSizeMm || 8,
        threadType: current.threadType || cfg.data.config?.defaultThreadType || cfg.data.config?.threadTypes?.[0]?.key || 'korean-elastic',
        czStyle: current.czStyle || cfg.data.config?.defaultCzStyle || cfg.data.config?.czOptions?.[0]?.key || 'cz',
        loading: false,
        ready: true,
        error: null,
      });
    } catch (e) {
      if (boot) set({ loading: false, error: e.message });
    }
  },

  // Recomputes `layer`, `intention` and `calibration` from the current selection.
  refresh() {
    set(deriveSelection(get()));
  },

  // --- navigation -----------------------------------------------------------

  setStep(step) {
    const next = Math.min(Math.max(Number(step) || 1, 1), STEP_COUNT);
    set({ step: next, stepError: '' });
  },

  goBack() {
    const { step } = get();
    if (step <= 1) return;
    set({ step: step - 1, stepError: '' });
  },

  goNext() {
    const state = get();
    if (state.advancing || state.step >= REVIEW_STEP) return;
    const entry = stepAt(state.step);
    if (!entry.validate(state)) {
      set({ stepError: entry.hint(state) || 'Finish this step to continue.' });
      return;
    }
    if (entry.id === 'crystals' || entry.id === 'fit') get().applyStrand();
    set({ step: state.step + 1, stepError: '' });
  },

  // Steps already satisfied stay reachable so the progress rail can jump back.
  canReachStep(step) {
    const state = get();
    if (step <= state.step) return true;
    for (let n = 1; n < step; n += 1) {
      if (!stepAt(n).validate(state)) return false;
    }
    return true;
  },

  // --- path & selection -----------------------------------------------------

  // Drops the current pick but stays on the same path, so "Change" returns the user
  // to the grid they came from instead of the top of the flow.
  clearSelection() {
    set({ ...SELECTION_DEFAULTS, path: get().path, step: 1 });
  },

  async loadLayerItems(kind) {
    const path = kind || get().path;
    if (!isLayerPath(path)) return;
    if (get().layerKindLoaded === path && get().layerItems.length) return;
    set({ layerLoading: true, stepError: '' });
    try {
      const { data } = await api.get(`/customizer/layers/${path}`);
      set({
        layerItems: data.items || [],
        layerKindLoaded: path,
        layerLoading: false,
        stepError: (data.items || []).length ? '' : 'No combinations in this catalog yet.',
      });
    } catch (e) {
      set({ layerLoading: false, stepError: e.message || 'Could not load this path.' });
    }
  },

  async selectPurpose(purpose) {
    const current = get();
    if (current.purpose?._id === purpose._id && current.intentions.length) return;
    set({ selecting: true, stepError: '' });
    try {
      const { data } = await api.get(`/customizer/purposes/${purpose.slug}/intentions`);
      set({
        ...SELECTION_DEFAULTS,
        path: 'purpose',
        purpose,
        intentions: data.intentions || [],
        selecting: false,
        stepError: data.intentions?.length ? '' : 'No intentions are mapped to this purpose yet.',
      });
    } catch (e) {
      set({ selecting: false, stepError: e.message || 'Could not load intentions.' });
    }
  },

  async toggleIntention(intention) {
    const current = get().selectedIntentions || [];
    const exists = current.some((it) => it._id === intention._id);
    let next = exists ? current.filter((it) => it._id !== intention._id) : [...current, intention];
    const cap = Number(get().config?.intentionCap) || 3;
    if (next.length > cap) next = next.slice(-cap);
    set({ selectedIntentions: next, stepError: '' });
    get().refresh();
    await get().loadIntentionBeads(next);
  },

  async loadIntentionBeads(list) {
    const selected = list || get().selectedIntentions || [];
    if (!selected.length) {
      set({ recommended: [], quantities: {}, ...deriveSelection({ ...get(), selectedIntentions: [] }) });
      return;
    }
    set({ selecting: true, stepError: '' });
    try {
      const packs = await Promise.all(
        selected.map((it) => api.get(`/customizer/intentions/${it._id}/beads`))
      );
      const byId = new Map();
      const bySource = packs.map(() => []);
      packs.forEach(({ data }, index) => {
        (data.beads || []).forEach((bead) => {
          const id = idOf(bead._id);
          if (byId.has(id)) return;
          byId.set(id, { ...bead, fromPrimary: index === 0 });
          bySource[index].push(id);
        });
      });
      const recommended = [...byId.values()];
      // Seed round-robin across the chosen intentions so a second or third intention
      // always shows up in the strand rather than being crowded out by the first.
      const seed = [];
      const cap = crystalLimits({ path: 'purpose', recommended, quantities: {}, config: get().config }).max;
      for (let round = 0; seed.length < cap; round += 1) {
        const before = seed.length;
        bySource.forEach((ids) => {
          if (seed.length < cap && ids[round]) seed.push(ids[round]);
        });
        if (seed.length === before) break;
      }
      get().setPool(recommended, seed, {});
      set({
        selecting: false,
        stepError: recommended.length ? '' : 'No crystals are mapped to these intentions yet.',
      });
    } catch (e) {
      set({
        recommended: [],
        quantities: {},
        selecting: false,
        stepError: e.message || 'Could not load crystals for this intention.',
      });
    }
  },

  selectLayerItem(item) {
    if (!item) return;
    const coreNames = new Set((item.recommended || []).map((slot) => slot.name));
    const extraSlots = (item.suitable || []).filter((slot) => !coreNames.has(slot.name));
    const core = beadsFromSlots(item.recommended);
    const pool = uniqueById([...core, ...beadsFromSlots(extraSlots)]);
    set({ layerItem: item, stepError: '' });
    const cap = crystalLimits({ path: get().path, recommended: pool, quantities: {}, config: get().config }).max;
    get().setPool(pool, core.slice(0, cap).map((b) => b._id), {});
  },

  setNumerology({ mulank, bhagyank } = {}) {
    const state = get();
    const nextM = mulank === undefined ? state.mulankNumber : mulank;
    const nextB = bhagyank === undefined ? state.bhagyankNumber : bhagyank;
    const mItem = findByNumber(state.layerItems, nextM);
    const bItem = findByNumber(state.layerItems, nextB);
    const rolesById = {};
    const mark = (slots, role) => {
      (slots || []).forEach((slot) => {
        const id = idOf(slot.bead?._id);
        if (!id) return;
        rolesById[id] = [...new Set([...(rolesById[id] || []), role])];
      });
    };
    mark(mItem?.mulank, 'Mulank');
    mark(bItem?.bhagyank, 'Bhagyank');
    const pool = uniqueById([...beadsFromSlots(mItem?.mulank), ...beadsFromSlots(bItem?.bhagyank)]);
    set({ mulankNumber: nextM ?? null, bhagyankNumber: nextB ?? null, stepError: '' });
    const cap = crystalLimits({ path: 'numerology', recommended: pool, quantities: {}, config: get().config }).max;
    get().setPool(
      pool.map((bead) => ({ ...bead, roles: rolesById[idOf(bead._id)] || [] })),
      pool.slice(0, cap).map((b) => b._id),
      rolesById
    );
  },

  setDateOfBirth(dateOfBirth) {
    set({ dateOfBirth: dateOfBirth || '' });
    if (!dateOfBirth || get().path !== 'numerology') {
      get().refresh();
      return;
    }
    try {
      get().setNumerology({
        mulank: mulankFromDate(dateOfBirth),
        bhagyank: bhagyankFromDate(dateOfBirth),
      });
    } catch {
      get().refresh();
    }
  },

  // --- crystals -------------------------------------------------------------

  // Replaces the candidate pool and pre-selects `selectedIds`, then redistributes
  // bead counts so the live quote is always real.
  setPool(pool, selectedIds, rolesById) {
    const beads = uniqueById(pool);
    const state = get();
    const wanted = (selectedIds || []).map(idOf).filter(Boolean);
    const quantities = {};
    beads.forEach((bead) => {
      quantities[idOf(bead._id)] = 0;
    });
    Object.assign(quantities, distributeQty(wanted, strandSize(state)));
    const next = {
      recommended: beads,
      quantities,
      rolesById: rolesById || state.rolesById || {},
    };
    set({ ...next, ...deriveSelection({ ...state, ...next }) });
  },

  toggleBead(beadId) {
    const id = idOf(beadId);
    if (!id) return;
    const state = get();
    const on = qtyOf(state.quantities, id) > 0;
    const limits = crystalLimits(state);
    if (!on && limits.count >= limits.max) {
      set({ stepError: `Keep at most ${limits.max} crystals.` });
      return;
    }
    if (on && limits.count <= 1) {
      set({ stepError: 'Keep at least one crystal in the strand.' });
      return;
    }
    const selected = state.recommended
      .filter((bead) => {
        const beadOn = qtyOf(state.quantities, bead._id) > 0;
        return idOf(bead._id) === id ? !on : beadOn;
      })
      .map((bead) => bead._id);
    get().setPool(state.recommended, selected, state.rolesById);
    set({ stepError: '' });
  },

  addCatalogBead(bead) {
    const state = get();
    if (!bead?._id) return;
    if (state.recommended.some((row) => idOf(row._id) === idOf(bead._id))) return;
    const limits = crystalLimits(state);
    if (limits.count >= limits.max) {
      set({ stepError: `Keep at most ${limits.max} crystals.` });
      return;
    }
    const selected = state.recommended
      .filter((row) => qtyOf(state.quantities, row._id) > 0)
      .map((row) => row._id);
    get().setPool([...state.recommended, bead], [...selected, bead._id], state.rolesById);
    set({ stepError: '' });
  },

  setBeadQty(beadId, qty) {
    const id = idOf(beadId);
    const n = Math.max(0, Math.round(Number(qty) || 0));
    const state = get();
    const limit = Number(state.config?.beadLimit) || 32;
    const others = Object.entries(state.quantities).reduce(
      (sum, [key, value]) => (idOf(key) === id ? sum : sum + (Number(value) || 0)),
      0
    );
    const quantities = { ...state.quantities, [id]: Math.min(n, Math.max(0, limit - others)) };
    set({ quantities, ...deriveSelection({ ...state, quantities }) });
  },

  applyStrand() {
    const state = get();
    const ids = state.recommended
      .filter((bead) => qtyOf(state.quantities, bead._id) > 0)
      .map((bead) => bead._id);
    if (!ids.length) return;
    get().setPool(state.recommended, ids, state.rolesById);
  },

  selectedBeads() {
    const state = get();
    return (state.recommended || []).filter((bead) => qtyOf(state.quantities, bead._id) > 0);
  },

  // --- finishing ------------------------------------------------------------

  selectCharm(charm, finish) {
    set({ charm, finish: finish || charm?.finishes?.[0] || null, stepError: '' });
  },

  setFinish(finish) {
    set({ finish });
  },

  setWristSize(wristSize) {
    set({ wristSize });
    get().applyStrand();
  },

  setBeadSizeMm(beadSizeMm) {
    set({ beadSizeMm: Number(beadSizeMm) || 8 });
    get().applyStrand();
  },

  setCzStyle(czStyle) {
    set({ czStyle });
  },

  setThreadType(threadType) {
    const config = get().config;
    const sizes = config?.wristSizes || ['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'];
    const current = get().wristSize;
    const next = sizes.includes(current) ? current : config?.defaultWristSize || '6.5"';
    set({ threadType, wristSize: next });
    get().applyStrand();
  },

  setEngravingName(engravingName) {
    set({ engravingName });
  },

  // --- ui -------------------------------------------------------------------

  setDetailBead(detailBead) {
    set({ detailBead });
  },

  setPreviewOpen(previewOpen) {
    set({ previewOpen });
  },

  // --- url ------------------------------------------------------------------

  // The only place URL params turn into state. `CustomizePage` calls this from a
  // single effect, and reads `urlQuery()` back to keep the address bar canonical.
  async syncFromUrl(params) {
    set({ urlSyncing: get().urlSyncing + 1 });
    try {
      const requested = params.get('path') || (params.get('purpose') ? 'purpose' : '');
      const allowed = studioPaths(get().config);
      const path = allowed.includes(requested) ? requested : (allowed[0] || '');
      if (!get().ready) await get().init();
      if (path && path !== get().path) {
        set({ ...SELECTION_DEFAULTS, path, step: 1, layerItems: [], layerKindLoaded: '' });
      }
      const active = get().path;

      if (active === 'purpose') {
        const slug = params.get('purpose');
        if (!slug || get().purpose?.slug === slug) return;
        const match = (get().purposes || []).find((p) => p.slug === slug);
        if (match) await get().selectPurpose(match);
        return;
      }

      await get().loadLayerItems(active);
      const items = get().layerItems;
      if (!items.length) return;

      if (active === 'numerology') {
        const dob = params.get('dob') || '';
        if (dob && !get().dateOfBirth) {
          get().setDateOfBirth(dob);
          if (get().mulankNumber || get().bhagyankNumber) return;
        }
        const m = params.get('mulank');
        const b = params.get('bhagyank');
        if ((m || b) && !get().mulankNumber && !get().bhagyankNumber) {
          get().setNumerology({ mulank: m ? Number(m) : null, bhagyank: b ? Number(b) : null });
        }
        return;
      }

      const key = params.get('key');
      if (!key || get().layerItem?.slug === key) return;
      const item = items.find((row) => String(row.slug) === String(key));
      if (item) get().selectLayerItem(item);
      else set({ stepError: 'That combination could not be opened.' });
    } finally {
      set({ urlSyncing: Math.max(0, get().urlSyncing - 1) });
    }
  },

  clearBuild() {
    set({
      ...SELECTION_DEFAULTS,
      step: 1,
      path: 'purpose',
      layerItems: [],
      layerKindLoaded: '',
      engravingName: '',
      detailBead: null,
      beadSizeMm: get().config?.defaultBeadSizeMm || 8,
      wristSize: get().config?.defaultWristSize || '6.5"',
      czStyle: get().config?.defaultCzStyle || 'cz',
      threadType: get().config?.defaultThreadType || 'korean-elastic',
    });
  },

  toCartPayload() {
    const {
      layer,
      purpose,
      intention,
      selectedIntentions,
      recommended,
      quantities,
      charm,
      finish,
      wristSize,
      beadSizeMm,
      czStyle,
      threadType,
      dateOfBirth,
      engravingName,
      calibration,
    } = get();
    if (get().config?.charmRequired !== false && (!charm || !finish)) throw new Error('Choose a charm first.');
    const quote = buildQuote(get());
    const beads = (recommended || [])
      .filter((b) => qtyOf(quantities, b._id) > 0)
      .map((b) => ({ beadId: b._id, quantity: qtyOf(quantities, b._id) }));
    if (!beads.length) throw new Error('Choose crystals for this strand first.');
    const wristLabel = formatWristChoice(threadType, wristSize, get().config?.threadTypes);
    const extras = {
      beadSizeMm,
      czStyle: czStyle || 'cz',
      engravingName: engravingName || '',
    };
    if (layer) {
      return {
        purpose: { name: layer.modeLabel, slug: layer.kind },
        intention: { name: layer.name, slug: layer.key },
        layer: { kind: layer.kind, key: layer.key, name: layer.name },
        beads,
        charmId: charm?._id,
        finishKey: finish?.key,
        wristSize: wristLabel,
        threadType,
        dateOfBirth: dateOfBirth || undefined,
        ...extras,
        snapshot: {
          name: `${layer.name}${charm?.name ? ` · ${charm.name}` : ''}`,
          purpose: { name: layer.modeLabel },
          intention: { name: layer.name },
          layer: { kind: layer.kind, key: layer.key, name: layer.name },
          layerSelections: layer.selections || calibration?.layerSelections,
          beads: quote.lines.map((line) => ({
            ...line,
            roles: layer.rolesById?.[String(line.beadId)] || line.roles || [],
          })),
          mulank: calibration?.mulank,
          bhagyank: calibration?.bhagyank,
          zodiac: calibration?.zodiac,
          dateOfBirth,
          explanation: calibration?.explanation,
          charm: charm ? { id: charm._id, name: charm.name, slug: charm.slug } : null,
          finish,
          threadType,
          wristSize: wristLabel,
          pricing: quote,
          ...extras,
        },
      };
    }
    const picked = selectedIntentions?.length ? selectedIntentions : intention ? [intention] : [];
    if (!purpose || !picked.length) throw new Error('Choose a purpose and intention first.');
    const primary = picked[0];
    const braceletName = primary.braceletName || primary.name;
    return {
      purpose: { id: purpose._id, name: purpose.name, slug: purpose.slug },
      intention: {
        id: primary._id,
        name: braceletName,
        slug: primary.slug,
        braceletName,
      },
      intentionId: primary._id,
      beads,
      charmId: charm?._id,
      finishKey: finish?.key,
      wristSize: wristLabel,
      threadType,
      ...extras,
      snapshot: {
        name: `${braceletName}${charm?.name ? ` · ${charm.name}` : ''}`,
        purpose: { id: purpose._id, name: purpose.name },
        intention: { id: primary._id, name: braceletName, braceletName },
        intentions: picked.map((it) => ({ id: it._id, name: it.name, braceletName: it.braceletName })),
        beads: quote.lines,
        explanation: picked.map((it) => it.braceletName || it.name).join(' · '),
        charm: charm ? { id: charm._id, name: charm.name, slug: charm.slug } : null,
        finish,
        threadType,
        wristSize: wristLabel,
        pricing: quote,
        ...extras,
      },
    };
  },
}));

export function buildQuote(state) {
  const beads = (state.recommended || []).map((b) => ({
    ...b,
    beadId: b._id,
    quantity: qtyOf(state.quantities, b._id),
  }));
  return quoteFromBeads(state.config, beads, state.finish, { czStyle: state.czStyle || 'cz' });
}

export function useCustomizerQuote() {
  const config = useCustomizerStore((s) => s.config);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const finish = useCustomizerStore((s) => s.finish);
  const czStyle = useCustomizerStore((s) => s.czStyle);
  return useMemo(
    () => buildQuote({ config, recommended, quantities, finish, czStyle }),
    [config, recommended, quantities, finish, czStyle]
  );
}
