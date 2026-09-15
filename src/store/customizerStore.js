import { useMemo } from 'react';
import { create } from 'zustand';
import api from '../api/client';
import { calibrateLocal, quoteFromBeads } from '../lib/calibration';
import { formatWristChoice } from '../lib/format';

function distributeQty(ids, total) {
  const keys = (ids || []).filter(Boolean);
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

export const useCustomizerStore = create((set, get) => ({
  step: 1,
  config: null,
  purposes: [],
  intentions: [],
  recommended: [],
  catalogBeads: [],
  charms: [],
  purpose: null,
  intention: null,
  quantities: {},
  charm: null,
  finish: null,
  wristSize: 'Free size',
  threadType: 'korean-elastic',
  dateOfBirth: '',
  engravingName: '',
  calibration: null,
  zodiacAdded: false,
  detailBead: null,
  previewOpen: false,
  loading: false,
  ready: false,
  calibrating: false,
  advancing: false,
  selectingIntention: false,
  error: null,
  stepError: '',
  layer: null,

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
        ? purposes.find((p) => p._id === current.purpose._id || p.slug === current.purpose.slug) || current.purpose
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
        wristSize: current.wristSize || 'Free size',
        threadType: current.threadType || 'korean-elastic',
        loading: false,
        ready: true,
        error: null,
      });
    } catch (e) {
      if (boot) set({ loading: false, error: e.message });
    }
  },

  setStep(step) {
    set({ step, stepError: '' });
  },

  setDateOfBirth(dateOfBirth) {
    set({ dateOfBirth });
  },

  async selectPurpose(purpose) {
    const current = get();
    if (current.purpose?._id === purpose._id && current.intentions.length) {
      set({ step: 2, stepError: '', layer: null });
      return;
    }
    set({ stepError: '' });
    try {
      const { data } = await api.get(`/customizer/purposes/${purpose.slug}/intentions`);
      set({
        purpose,
        layer: null,
        intentions: data.intentions || [],
        intention: null,
        recommended: [],
        quantities: {},
        calibration: null,
        zodiacAdded: false,
        dateOfBirth: '',
        step: 2,
        stepError: data.intentions?.length ? '' : 'No intentions are mapped to this purpose yet.',
      });
    } catch (e) {
      set({ stepError: e.message || 'Could not load intentions.' });
    }
  },

  async selectIntention(intention) {
    set({ stepError: '', selectingIntention: true, intention });
    try {
      const { data } = await api.get(`/customizer/intentions/${intention._id}/beads`);
      const beads = data.beads || [];
      const quantities = {};
      beads.forEach((b) => {
        quantities[b._id] = 1;
      });
      set({
        intention,
        recommended: beads,
        quantities,
        calibration: null,
        zodiacAdded: false,
        stepError: beads.length ? '' : 'No crystals are mapped to this intention yet.',
      });
    } catch (e) {
      set({
        recommended: [],
        quantities: {},
        stepError: e.message || 'Could not load crystals for this intention.',
      });
    } finally {
      set({ selectingIntention: false });
    }
  },

  toggleBead(beadId) {
    const { quantities } = get();
    const on = (quantities[beadId] || 0) > 0;
    set({ quantities: { ...quantities, [beadId]: on ? 0 : 1 } });
  },

  setBeadQty(beadId, qty) {
    const n = Math.max(0, Math.round(Number(qty) || 0));
    const { quantities, config } = get();
    const limit = config?.beadLimit || 18;
    const others = Object.entries(quantities).reduce(
      (sum, [id, value]) => (String(id) === String(beadId) ? sum : sum + (Number(value) || 0)),
      0
    );
    set({ quantities: { ...quantities, [beadId]: Math.min(n, Math.max(0, limit - others)) } });
  },

  applyBeadCount(count) {
    const { recommended, quantities } = get();
    const selected = recommended.filter((b) => (quantities[b._id] || 0) > 0);
    const ids = (selected.length ? selected : recommended).map((b) => b._id);
    const next = {};
    recommended.forEach((b) => {
      next[b._id] = 0;
    });
    set({ quantities: { ...next, ...distributeQty(ids, count) } });
  },

  addCatalogBead(bead) {
    const { recommended, quantities } = get();
    if (!bead?._id || recommended.some((b) => String(b._id) === String(bead._id))) return;
    set({
      recommended: [...recommended, bead],
      quantities: { ...quantities, [bead._id]: 1 },
    });
  },

  selectedBeads() {
    const { recommended, quantities } = get();
    return (recommended || []).filter((b) => (quantities[b._id] || 0) > 0);
  },

  async runCalibration({ includeZodiac = false, zodiacQty } = {}) {
    const { intention, recommended, quantities, catalogBeads, config, charm, finish, dateOfBirth } = get();
    if (!intention?._id) throw new Error('Choose an intention first.');
    if (!dateOfBirth) throw new Error('Enter a date of birth.');
    const selectedBeads = (recommended || []).filter((b) => (quantities[b._id] || 0) > 0);
    const intentionBeads = selectedBeads.length ? selectedBeads : recommended;
    const parsed = Number(zodiacQty);
    const qty = Number.isFinite(parsed) && parsed > 0 ? parsed : (config?.zodiacBeadCount || 2);
    set({ calibrating: true, stepError: '' });
    try {
      try {
        const { data } = await api.post('/customizer/calibrate', {
          intentionId: intention._id,
          dateOfBirth,
          includeZodiac,
          zodiacQty: qty,
          charmId: charm?._id,
          finishKey: finish?.key,
        });
        set({
          calibration: data,
          zodiacAdded: Boolean(includeZodiac),
          calibrating: false,
        });
        return data;
      } catch {
        const data = calibrateLocal({
          dateOfBirth,
          intentionBeads,
          catalogBeads,
          config,
          finish,
          includeZodiac,
          zodiacQty: qty,
        });
        set({
          calibration: data,
          zodiacAdded: Boolean(includeZodiac),
          calibrating: false,
        });
        return data;
      }
    } catch (e) {
      set({ calibrating: false, stepError: e.message });
      throw e;
    }
  },

  async submitBirthDate(dateOfBirth) {
    set({ dateOfBirth });
    return get().runCalibration({ includeZodiac: false });
  },

  async addZodiacBeads(zodiacQty) {
    return get().runCalibration({ includeZodiac: true, zodiacQty });
  },

  applyLayer({
    kind,
    key,
    path,
    modeLabel,
    name,
    hindi,
    theme,
    beads,
    dateOfBirth = '',
    mulank,
    bhagyank,
    rolesById = {},
    layerSelections = null,
  }) {
    const config = get().config;
    const limit = config?.beadLimit || 18;
    const unique = [];
    const seen = new Set();
    (beads || []).forEach((bead) => {
      if (!bead?._id || seen.has(String(bead._id))) return;
      seen.add(String(bead._id));
      unique.push(bead);
    });
    const quantities = distributeQty(unique.map((b) => b._id), limit);
    const priced = unique.map((b) => ({
      ...b,
      beadId: b._id,
      quantity: quantities[b._id] || 0,
      roles: rolesById[String(b._id)] || [],
    }));
    const charms = get().charms || [];
    const charm = get().charm || charms[0] || null;
    const nextFinish =
      get().finish ||
      charm?.finishes?.[0] ||
      null;
    const quote = quoteFromBeads(config, priced, nextFinish);
    set({
      charm,
      finish: nextFinish,
      layer: {
        kind,
        key,
        path,
        modeLabel,
        name,
        hindi,
        theme,
        mulank,
        bhagyank,
        rolesById,
        selections: layerSelections,
      },
      purpose: { name: modeLabel, slug: kind },
      intention: { name, slug: key },
      intentions: [],
      recommended: unique.map((b) => ({
        ...b,
        roles: rolesById[String(b._id)] || [],
      })),
      quantities,
      dateOfBirth: dateOfBirth || '',
      calibration: {
        dateOfBirth: dateOfBirth || '',
        mulank,
        bhagyank,
        zodiac: kind === 'zodiac' ? { sign: name } : undefined,
        beads: unique.map((b) => ({
          beadId: b._id,
          quantity: quantities[b._id],
          roles: rolesById[String(b._id)] || [],
        })),
        layout: [],
        explanation: theme
          ? `${name}: ${theme}. Traditional catalog associations, not medical claims.`
          : '',
        quote,
        layerSelections,
      },
      zodiacAdded: true,
      step: 5,
      stepError: '',
    });
  },

  async hydrateLayerFromQuery({ kind, key, mulank, bhagyank, dateOfBirth }) {
    if (!kind || !key) return;
    const current = get().layer;
    if (current?.kind === kind && String(current?.key) === String(key) && (get().recommended || []).length) {
      if (get().step < 5) set({ step: 5 });
      return;
    }
    if (!get().ready) await get().init();
    const labels = {
      numerology: 'Customise by numerology',
      zodiac: 'Customise by zodiac sign',
      planetary: 'Customise by planetary',
      profession: 'Customise by profession',
    };
    try {
      if (kind === 'numerology') {
        const rawKey = String(key || '');
        let m = mulank;
        let b = bhagyank;
        if (!m && !b) {
          if (rawKey.startsWith('m')) m = rawKey.slice(1);
          else if (rawKey.startsWith('b')) b = rawKey.slice(1);
          else {
            const parts = rawKey.split('-');
            m = parts[0];
            b = parts[1];
          }
        }
        if (dateOfBirth && (!m || !b)) {
          const { data } = await api.get(`/customizer/layers/numerology/${m || '1'}`, {
            params: { dateOfBirth },
          });
          const mulankItem = data.mulank;
          const bhagyankItem = data.bhagyank || data.mulank;
          const beads = [];
          const seen = new Set();
          const rolesById = {};
          const mark = (slots, role) => {
            (slots || []).forEach((slot) => {
              const bead = slot.bead;
              if (!bead?._id) return;
              const id = String(bead._id);
              rolesById[id] = [...new Set([...(rolesById[id] || []), role])];
              if (seen.has(id)) return;
              seen.add(id);
              beads.push(bead);
            });
          };
          mark(mulankItem?.mulank, 'Mulank');
          mark(bhagyankItem?.bhagyank, 'Bhagyank');
          get().applyLayer({
            kind: 'numerology',
            key: `${mulankItem.number}-${bhagyankItem.number}`,
            path: '/customize/numerology',
            modeLabel: labels.numerology,
            name: [mulankItem.theme, bhagyankItem.theme].filter(Boolean).filter((value, i, all) => all.indexOf(value) === i).join(' · '),
            theme: [mulankItem.theme, bhagyankItem.theme].filter(Boolean).join(' · '),
            beads,
            dateOfBirth: data.dateOfBirth || dateOfBirth || '',
            mulank: mulankItem.number,
            bhagyank: bhagyankItem.number,
            rolesById,
            layerSelections: {
              mulank: { number: mulankItem.number, beads: (mulankItem.mulank || []).map((s) => s.bead?.name).filter(Boolean) },
              bhagyank: { number: bhagyankItem.number, beads: (bhagyankItem.bhagyank || []).map((s) => s.bead?.name).filter(Boolean) },
            },
          });
          return;
        }
        const rolesById = {};
        const beads = [];
        const seen = new Set();
        let mulankItem = null;
        let bhagyankItem = null;
        if (m) {
          const { data } = await api.get(`/customizer/layers/numerology/${m}`);
          mulankItem = data.item || data.mulank;
          (mulankItem?.mulank || []).forEach((slot) => {
            const bead = slot.bead;
            if (!bead?._id) return;
            const id = String(bead._id);
            rolesById[id] = [...new Set([...(rolesById[id] || []), 'Mulank'])];
            if (!seen.has(id)) {
              seen.add(id);
              beads.push(bead);
            }
          });
        }
        if (b) {
          const { data } = await api.get(`/customizer/layers/numerology/${b}`);
          bhagyankItem = data.item || data.bhagyank;
          (bhagyankItem?.bhagyank || []).forEach((slot) => {
            const bead = slot.bead;
            if (!bead?._id) return;
            const id = String(bead._id);
            rolesById[id] = [...new Set([...(rolesById[id] || []), 'Bhagyank'])];
            if (!seen.has(id)) {
              seen.add(id);
              beads.push(bead);
            }
          });
        }
        if (!beads.length) {
          set({ stepError: 'Those numerology crystals are not in the atelier yet.' });
          return;
        }
        const mNum = mulankItem?.number;
        const bNum = bhagyankItem?.number;
        get().applyLayer({
          kind: 'numerology',
          key: mNum && bNum ? `${mNum}-${bNum}` : mNum ? `m${mNum}` : `b${bNum}`,
          path: '/customize/numerology',
          modeLabel: labels.numerology,
          name: [mulankItem?.theme, bhagyankItem?.theme].filter(Boolean).filter((value, i, all) => all.indexOf(value) === i).join(' · '),
          theme: [mulankItem?.theme, bhagyankItem?.theme].filter(Boolean).join(' · '),
          beads,
          dateOfBirth: dateOfBirth || '',
          mulank: mNum,
          bhagyank: bNum,
          rolesById,
          layerSelections: {
            mulank: mulankItem
              ? { number: mNum, beads: (mulankItem.mulank || []).map((s) => s.bead?.name).filter(Boolean) }
              : null,
            bhagyank: bhagyankItem
              ? { number: bNum, beads: (bhagyankItem.bhagyank || []).map((s) => s.bead?.name).filter(Boolean) }
              : null,
          },
        });
        return;
      }
      const { data } = await api.get(`/customizer/layers/${kind}/${key}`);
      const item = data.item;
      if (!item) {
        set({ stepError: 'That combination could not be opened.' });
        return;
      }
      const beads = (item.recommended || []).map((slot) => slot.bead).filter(Boolean);
      if (!beads.length) {
        set({ stepError: 'Those crystals are not in the atelier yet.' });
        return;
      }
      get().applyLayer({
        kind,
        key: item.slug,
        path: `/customize/${kind}`,
        modeLabel: labels[kind] || 'Customization',
        name: item.name,
        hindi: item.hindi,
        theme: item.theme,
        beads,
      });
    } catch (e) {
      set({ stepError: e.message || 'Could not open that customisation path.' });
    }
  },

  async goBack() {
    const step = get().step;
    const layer = get().layer;
    if (layer && step <= 5) return;
    if (step > 1) set({ step: step - 1, stepError: '' });
  },

  async goNext() {
    if (get().advancing) return;
    const state = get();
    set({ advancing: true, stepError: '' });
    try {
      if (state.layer) {
        if (state.step < 5) {
          set({ step: 5 });
          return;
        }
        if (state.step === 5) {
          if (!get().charm) throw new Error('Choose a charm to continue.');
          if (get().threadType === 'steel-core' && !get().wristSize) {
            throw new Error('Choose a wrist size for steel core thread.');
          }
          set({ step: 6 });
        }
        return;
      }
      if (state.step === 1) {
        if (!get().purpose) throw new Error('Choose a purpose to continue.');
        set({ step: 2 });
        return;
      }
      if (state.step === 2) {
        const picked = get().selectedBeads();
        if (!get().intention || !picked.length) {
          throw new Error('Select an intention so its crystals are chosen.');
        }
        set({ step: 3 });
        return;
      }
      if (state.step === 3) {
        const dob = get().dateOfBirth;
        if (!dob) throw new Error('Choose day, month and year to continue.');
        const cal = get().calibration;
        if (!cal || cal.dateOfBirth !== dob) {
          await get().runCalibration({ includeZodiac: false });
        }
        set({ step: 4 });
        return;
      }
      if (state.step === 4) {
        if (!get().calibration) throw new Error('Calibrate from your date of birth first.');
        if (!get().zodiacAdded) {
          await get().runCalibration({ includeZodiac: true });
        }
        set({ step: 5 });
        return;
      }
      if (state.step === 5) {
        if (!get().charm) throw new Error('Choose a charm to continue.');
        if (get().threadType === 'steel-core' && !get().wristSize) {
          throw new Error('Choose a wrist size for steel core thread.');
        }
        set({ step: 6 });
      }
    } catch (e) {
      set({ stepError: e.message || 'Could not continue.' });
    } finally {
      set({ advancing: false });
    }
  },

  canAdvance() {
    const s = get();
    if (s.layer) {
      if (s.step === 5) return !!s.charm && (s.threadType !== 'steel-core' || Boolean(s.wristSize));
      return false;
    }
    if (s.step === 1) return !!s.purpose;
    if (s.step === 2) return !!s.intention && get().selectedBeads().length > 0;
    if (s.step === 3) return Boolean(s.dateOfBirth);
    if (s.step === 4) return !!s.calibration;
    if (s.step === 5) {
      return !!s.charm && (s.threadType !== 'steel-core' || Boolean(s.wristSize));
    }
    return false;
  },

  selectCharm(charm, finish) {
    set({ charm, finish: finish || charm.finishes?.[0] });
  },

  setFinish(finish) {
    set({ finish });
  },

  setWristSize(wristSize) {
    set({ wristSize });
  },

  setThreadType(threadType) {
    const config = get().config;
    if (threadType === 'korean-elastic') {
      set({ threadType, wristSize: 'Free size' });
      return;
    }
    const sizes = config?.wristSizes || ['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'];
    const current = get().wristSize;
    const next = sizes.includes(current) ? current : (config?.defaultWristSize || '6.5"');
    set({ threadType: 'steel-core', wristSize: next });
  },

  setDetailBead(bead) {
    set({ detailBead: bead });
  },

  setPreviewOpen(previewOpen) {
    set({ previewOpen });
  },

  clearBuild() {
    set({
      step: 1,
      layer: null,
      purpose: null,
      intention: null,
      intentions: [],
      recommended: [],
      quantities: {},
      dateOfBirth: '',
      calibration: null,
      zodiacAdded: false,
      detailBead: null,
      stepError: '',
    });
  },

  toCartPayload() {
    const {
      layer,
      purpose,
      intention,
      recommended,
      quantities,
      charm,
      finish,
      wristSize,
      threadType,
      dateOfBirth,
      calibration,
      zodiacAdded,
    } = get();
    if (!charm || !finish) throw new Error('Choose a charm first.');
    if (layer) {
      const quote = buildQuote(get());
      const beads = (recommended || [])
        .filter((b) => (quantities[b._id] || 0) > 0)
        .map((b) => ({ beadId: b._id, quantity: quantities[b._id] }));
      if (!beads.length) throw new Error('Choose crystals for this strand first.');
      const wristLabel = formatWristChoice(threadType, wristSize);
      return {
        purpose: { name: layer.modeLabel, slug: layer.kind },
        intention: { name: layer.name, slug: layer.key },
        layer: { kind: layer.kind, key: layer.key, name: layer.name },
        beads,
        charmId: charm._id,
        finishKey: finish.key,
        wristSize: wristLabel,
        threadType,
        dateOfBirth: dateOfBirth || undefined,
        snapshot: {
          name: `${layer.name} · ${charm.name}`,
          purpose: { name: layer.modeLabel },
          intention: { name: layer.name },
          layer: { kind: layer.kind, key: layer.key, name: layer.name },
          layerSelections: layer.selections || calibration?.layerSelections,
          beads: quote.lines.map((line) => ({
            ...line,
            roles: layer.rolesById?.[String(line.beadId)] || line.roles || [],
          })),
          layout: calibration?.layout || [],
          mulank: calibration?.mulank,
          bhagyank: calibration?.bhagyank,
          zodiac: calibration?.zodiac,
          dateOfBirth,
          explanation: calibration?.explanation,
          charm: { id: charm._id, name: charm.name, slug: charm.slug },
          finish,
          threadType,
          wristSize: wristLabel,
          pricing: quote,
        },
      };
    }
    if (!purpose || !intention) throw new Error('Choose a purpose and intention first.');
    if (!dateOfBirth) throw new Error('Enter a date of birth first.');
    const quote = buildQuote(get());
    const beads = calibration?.beads
      || recommended
        .filter((b) => (quantities[b._id] || 0) > 0)
        .map((b) => ({ beadId: b._id, quantity: quantities[b._id] }));
    const wristLabel = formatWristChoice(threadType, wristSize);
    return {
      purpose: { id: purpose._id, name: purpose.name, slug: purpose.slug },
      intention: { id: intention._id, name: intention.name, slug: intention.slug },
      intentionId: intention._id,
      beads: (beads || []).map((b) => ({
        beadId: b.beadId || b._id,
        quantity: b.quantity,
      })),
      charmId: charm._id,
      finishKey: finish.key,
      wristSize: wristLabel,
      threadType,
      dateOfBirth,
      includeZodiac: zodiacAdded,
      zodiacQty: calibration?.zodiacQty,
      snapshot: {
        name: `${intention.name} · ${charm.name}`,
        purpose: { id: purpose._id, name: purpose.name },
        intention: { id: intention._id, name: intention.name },
        beads: quote.lines,
        layout: calibration?.layout || [],
        mulank: calibration?.mulank,
        bhagyank: calibration?.bhagyank,
        zodiac: calibration?.zodiac,
        dateOfBirth,
        explanation: calibration?.explanation,
        charm: { id: charm._id, name: charm.name, slug: charm.slug },
        finish,
        threadType,
        wristSize: wristLabel,
        pricing: quote,
      },
    };
  },
}));

export function buildQuote(state) {
  if (state.calibration?.quote) {
    return {
      ...state.calibration.quote,
      charmPrice: state.finish?.price ?? state.calibration.quote.charmPrice,
      total:
        (state.calibration.quote.baseMakingPrice || 0) +
        (state.calibration.quote.beadsTotal || 0) +
        (state.finish?.price || 0),
    };
  }
  const beads = (state.recommended || []).map((b) => ({
    ...b,
    beadId: b._id,
    quantity: state.quantities?.[b._id] || 0,
  }));
  return quoteFromBeads(state.config, beads, state.finish);
}

export function useCustomizerQuote() {
  const config = useCustomizerStore((s) => s.config);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const finish = useCustomizerStore((s) => s.finish);
  const calibration = useCustomizerStore((s) => s.calibration);
  return useMemo(
    () => buildQuote({ config, recommended, quantities, finish, calibration }),
    [config, recommended, quantities, finish, calibration]
  );
}
