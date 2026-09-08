import { useMemo } from 'react';
import { create } from 'zustand';
import api from '../api/client';
import { calibrateLocal, quoteFromBeads } from '../lib/calibration';

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
  wristSize: '6.5"',
  dateOfBirth: '',
  engravingName: '',
  calibration: null,
  zodiacAdded: false,
  detailBead: null,
  previewOpen: true,
  loading: false,
  ready: false,
  calibrating: false,
  advancing: false,
  selectingIntention: false,
  error: null,
  stepError: '',

  async init() {
    if (get().ready && get().purposes.length) return;
    set({ loading: true, error: null });
    try {
      const [cfg, pur, ch, beads] = await Promise.all([
        api.get('/customizer/config'),
        api.get('/customizer/purposes'),
        api.get('/customizer/charms'),
        api.get('/customizer/beads').catch(() => ({ data: { beads: [] } })),
      ]);
      const charm = get().charm || ch.data.charms[0] || null;
      const finish = get().finish || charm?.finishes?.[0] || null;
      set({
        config: cfg.data.config,
        purposes: pur.data.purposes,
        charms: ch.data.charms,
        catalogBeads: beads.data.beads || [],
        charm,
        finish,
        wristSize: get().wristSize || cfg.data.config?.defaultWristSize || '6.5"',
        loading: false,
        ready: true,
      });
    } catch (e) {
      set({ loading: false, error: e.message });
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
      set({ step: 2, stepError: '' });
      return;
    }
    set({ stepError: '' });
    try {
      const { data } = await api.get(`/customizer/purposes/${purpose.slug}/intentions`);
      set({
        purpose,
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
        selectingIntention: false,
        stepError: beads.length ? '' : 'No crystals are mapped to this intention yet.',
      });
    } catch (e) {
      set({
        selectingIntention: false,
        recommended: [],
        quantities: {},
        stepError: e.message || 'Could not load crystals for this intention.',
      });
    }
  },

  toggleBead(beadId) {
    const { quantities } = get();
    const next = { ...quantities, [beadId]: quantities[beadId] ? 0 : 1 };
    set({ quantities: next });
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
    const qty = zodiacQty || config?.zodiacBeadCount || 2;
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

  async goBack() {
    const step = get().step;
    if (step > 1) set({ step: step - 1, stepError: '' });
  },

  async goNext() {
    const state = get();
    set({ advancing: true, stepError: '' });
    try {
      if (state.step === 1) {
        if (!state.purpose) throw new Error('Choose a purpose to continue.');
        set({ step: 2, advancing: false });
        return;
      }
      if (state.step === 2) {
        const picked = get().selectedBeads();
        if (!state.intention || !picked.length) {
          throw new Error('Select an intention so its crystals are chosen.');
        }
        set({ step: 3, advancing: false });
        return;
      }
      if (state.step === 3) {
        if (!state.dateOfBirth) throw new Error('Enter a date of birth.');
        await get().runCalibration({ includeZodiac: false });
        set({ step: 4, advancing: false });
        return;
      }
      if (state.step === 4) {
        if (!get().zodiacAdded) await get().runCalibration({ includeZodiac: true });
        set({ step: 5, advancing: false });
        return;
      }
      if (state.step === 5) {
        if (get().engravingName.trim().length < 2) {
          throw new Error('Enter a name of at least 2 characters.');
        }
        set({ step: 6, advancing: false });
      }
    } catch (e) {
      set({ advancing: false, stepError: e.message || 'Could not continue.' });
    } finally {
      if (get().advancing) set({ advancing: false });
    }
  },

  canAdvance() {
    const s = get();
    if (s.step === 1) return !!s.purpose;
    if (s.step === 2) return !!s.intention && get().selectedBeads().length > 0;
    if (s.step === 3) return Boolean(s.dateOfBirth);
    if (s.step === 4) return !!s.calibration;
    if (s.step === 5) return s.engravingName.trim().length >= 2;
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

  setEngravingName(engravingName) {
    set({ engravingName });
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
      purpose: null,
      intention: null,
      intentions: [],
      recommended: [],
      quantities: {},
      dateOfBirth: '',
      engravingName: '',
      calibration: null,
      zodiacAdded: false,
      detailBead: null,
      stepError: '',
    });
  },

  toCartPayload() {
    const {
      purpose,
      intention,
      recommended,
      quantities,
      charm,
      finish,
      wristSize,
      dateOfBirth,
      engravingName,
      calibration,
      zodiacAdded,
    } = get();
    const quote = buildQuote(get());
    const beads = calibration?.beads
      || recommended
        .filter((b) => (quantities[b._id] || 0) > 0)
        .map((b) => ({ beadId: b._id, quantity: quantities[b._id] }));
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
      wristSize,
      dateOfBirth,
      includeZodiac: zodiacAdded,
      zodiacQty: calibration?.zodiacQty,
      engravingName: engravingName.trim(),
      snapshot: {
        name: `${engravingName.trim()} · ${intention.name}`,
        purpose: { id: purpose._id, name: purpose.name },
        intention: { id: intention._id, name: intention.name },
        beads: quote.lines,
        layout: calibration?.layout || [],
        mulank: calibration?.mulank,
        bhagyank: calibration?.bhagyank,
        zodiac: calibration?.zodiac,
        dateOfBirth,
        engravingName: engravingName.trim(),
        explanation: calibration?.explanation,
        charm: { id: charm._id, name: charm.name },
        finish,
        wristSize,
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
