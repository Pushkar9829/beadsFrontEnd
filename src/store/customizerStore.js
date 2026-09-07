import { useMemo } from 'react';
import { create } from 'zustand';
import api from '../api/client';

function localQuote(config, beads, finish) {
  const lines = beads
    .filter((b) => b.quantity > 0)
    .map((b) => ({
      beadId: b._id,
      name: b.name,
      quantity: b.quantity,
      pricePerBead: b.pricePerBead,
      subtotal: b.quantity * b.pricePerBead,
      colorHex: b.colorHex,
      image: b.image,
      powerUse: b.powerUse,
    }));
  const beadCount = lines.reduce((s, l) => s + l.quantity, 0);
  const beadsTotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const baseMakingPrice = config?.baseMakingPrice || 0;
  const charmPrice = finish?.price || 0;
  const total = baseMakingPrice + beadsTotal + charmPrice;
  const beadLimit = config?.beadLimit || 18;
  const minBeads = config?.minBeads || 1;
  const errors = [];
  if (beadCount < minBeads) errors.push(`Choose at least ${minBeads} bead.`);
  if (beadCount > beadLimit) errors.push(`This bracelet holds up to ${beadLimit} beads.`);
  return { lines, beadCount, beadsTotal, baseMakingPrice, charmPrice, addOns: 0, total, valid: errors.length === 0, errors };
}

export const useCustomizerStore = create((set, get) => ({
  step: 1,
  config: null,
  purposes: [],
  intentions: [],
  recommended: [],
  charms: [],
  purpose: null,
  intention: null,
  quantities: {},
  charm: null,
  finish: null,
  wristSize: '6.5"',
  detailBead: null,
  previewOpen: true,
  loading: false,
  error: null,

  quote() {
    return buildQuote(get());
  },

  remaining() {
    const quote = buildQuote(get());
    return (get().config?.beadLimit || 18) - quote.beadCount;
  },

  async init() {
    set({ loading: true, error: null });
    try {
      const [cfg, pur, ch] = await Promise.all([
        api.get('/customizer/config'),
        api.get('/customizer/purposes'),
        api.get('/customizer/charms'),
      ]);
      const charm = ch.data.charms[0] || null;
      set({
        config: cfg.data.config,
        purposes: pur.data.purposes,
        charms: ch.data.charms,
        charm,
        finish: charm?.finishes?.[0] || null,
        wristSize: cfg.data.config?.defaultWristSize || '6.5"',
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: e.message });
    }
  },

  setStep(step) {
    set({ step });
  },

  async selectPurpose(purpose) {
    const { data } = await api.get(`/customizer/purposes/${purpose.slug}/intentions`);
    set({
      purpose,
      intentions: data.intentions,
      intention: null,
      recommended: [],
      quantities: {},
      step: 2,
    });
  },

  async selectIntention(intention) {
    const { data } = await api.get(`/customizer/intentions/${intention._id}/beads`);
    const quantities = {};
    set({
      intention,
      recommended: data.beads,
      quantities,
      step: 3,
    });
  },

  setQty(beadId, qty) {
    const { config, quantities, recommended } = get();
    const limit = config?.beadLimit || 18;
    const others = recommended.reduce((s, b) => s + (b._id === beadId ? 0 : quantities[b._id] || 0), 0);
    const next = Math.max(0, Math.min(qty, limit - others));
    set({ quantities: { ...quantities, [beadId]: next } });
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
      detailBead: null,
    });
  },

  toCartPayload() {
    const { purpose, intention, recommended, quantities, charm, finish, wristSize } = get();
    const quote = buildQuote(get());
    const beads = recommended
      .filter((b) => (quantities[b._id] || 0) > 0)
      .map((b) => ({ beadId: b._id, quantity: quantities[b._id] }));
    return {
      purpose: { id: purpose._id, name: purpose.name, slug: purpose.slug },
      intention: { id: intention._id, name: intention.name, slug: intention.slug },
      beads,
      charmId: charm._id,
      finishKey: finish.key,
      wristSize,
      snapshot: {
        purpose: { id: purpose._id, name: purpose.name },
        intention: { id: intention._id, name: intention.name },
        beads: quote.lines,
        charm: { id: charm._id, name: charm.name },
        finish,
        wristSize,
        pricing: quote,
      },
    };
  },
}));

export function buildQuote(state) {
  const beads = (state.recommended || []).map((b) => ({
    ...b,
    quantity: state.quantities?.[b._id] || 0,
  }));
  return localQuote(state.config, beads, state.finish);
}

export function useCustomizerQuote() {
  const config = useCustomizerStore((s) => s.config);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const finish = useCustomizerStore((s) => s.finish);
  return useMemo(
    () => buildQuote({ config, recommended, quantities, finish }),
    [config, recommended, quantities, finish]
  );
}
