export const ZODIAC_TABLE = [
  { sign: 'Capricorn', slug: 'capricorn', fromMonth: 12, fromDay: 22, toMonth: 1, toDay: 19, beadName: 'Black Tourmaline' },
  { sign: 'Aquarius', slug: 'aquarius', fromMonth: 1, fromDay: 20, toMonth: 2, toDay: 18, beadName: 'Amethyst' },
  { sign: 'Pisces', slug: 'pisces', fromMonth: 2, fromDay: 19, toMonth: 3, toDay: 20, beadName: 'Labradorite' },
  { sign: 'Aries', slug: 'aries', fromMonth: 3, fromDay: 21, toMonth: 4, toDay: 19, beadName: 'Carnelian' },
  { sign: 'Taurus', slug: 'taurus', fromMonth: 4, fromDay: 20, toMonth: 5, toDay: 20, beadName: 'Rose Quartz' },
  { sign: 'Gemini', slug: 'gemini', fromMonth: 5, fromDay: 21, toMonth: 6, toDay: 20, beadName: 'Tiger Eye' },
  { sign: 'Cancer', slug: 'cancer', fromMonth: 6, fromDay: 21, toMonth: 7, toDay: 22, beadName: 'Moonstone' },
  { sign: 'Leo', slug: 'leo', fromMonth: 7, fromDay: 23, toMonth: 8, toDay: 22, beadName: 'Citrine' },
  { sign: 'Virgo', slug: 'virgo', fromMonth: 8, fromDay: 23, toMonth: 9, toDay: 22, beadName: 'Sodalite' },
  { sign: 'Libra', slug: 'libra', fromMonth: 9, fromDay: 23, toMonth: 10, toDay: 22, beadName: 'Lapis Lazuli' },
  { sign: 'Scorpio', slug: 'scorpio', fromMonth: 10, fromDay: 23, toMonth: 11, toDay: 21, beadName: 'Garnet' },
  { sign: 'Sagittarius', slug: 'sagittarius', fromMonth: 11, fromDay: 22, toMonth: 12, toDay: 21, beadName: 'Pyrite' },
];

export const MULANK_TABLE = {
  1: { beadName: 'Garnet', reason: 'Mulank 1 is calibrated with Garnet for rooted will and a clean start.' },
  2: { beadName: 'Moonstone', reason: 'Mulank 2 is calibrated with Moonstone for receptivity and balance.' },
  3: { beadName: 'Citrine', reason: 'Mulank 3 is calibrated with Citrine for expression and sunny momentum.' },
  4: { beadName: 'Green Aventurine', reason: 'Mulank 4 is calibrated with Green Aventurine for steady growth.' },
  5: { beadName: 'Tiger Eye', reason: 'Mulank 5 is calibrated with Tiger Eye for focus through change.' },
  6: { beadName: 'Rose Quartz', reason: 'Mulank 6 is calibrated with Rose Quartz for harmony and care.' },
  7: { beadName: 'Amethyst', reason: 'Mulank 7 is calibrated with Amethyst for insight and inner quiet.' },
  8: { beadName: 'Black Tourmaline', reason: 'Mulank 8 is calibrated with Black Tourmaline for structure and protection.' },
  9: { beadName: 'Carnelian', reason: 'Mulank 9 is calibrated with Carnelian for completion and vitality.' },
};

export function parseDateParts(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Enter a valid date of birth.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    throw new Error('That date of birth is not valid.');
  }
  if (dt > new Date()) throw new Error('Date of birth cannot be in the future.');
  return { year, month, day, iso: raw };
}

function reduceToDigit(n) {
  let x = Math.abs(Number(n) || 0);
  if (x === 0) return 1;
  while (x > 9) {
    x = String(x).split('').reduce((sum, d) => sum + Number(d), 0);
  }
  return x;
}

export function mulankFromDate(iso) {
  return reduceToDigit(parseDateParts(iso).day);
}

export function bhagyankFromDate(iso) {
  const { year, month, day } = parseDateParts(iso);
  const digits = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  return reduceToDigit(digits.split('').reduce((s, d) => s + Number(d), 0));
}

function inZodiacRange({ month, day }, range) {
  const value = month * 100 + day;
  const from = range.fromMonth * 100 + range.fromDay;
  const to = range.toMonth * 100 + range.toDay;
  if (from <= to) return value >= from && value <= to;
  return value >= from || value <= to;
}

export function dateRangeLabel(range) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[range.fromMonth - 1]} ${range.fromDay} – ${months[range.toMonth - 1]} ${range.toDay}`;
}

export function zodiacFromDate(iso) {
  const parts = parseDateParts(iso);
  return ZODIAC_TABLE.find((r) => inZodiacRange(parts, r)) || ZODIAC_TABLE[0];
}

function slimBead(bead) {
  if (!bead) return null;
  return {
    _id: bead._id,
    beadId: bead.beadId || bead._id,
    name: bead.name,
    slug: bead.slug,
    image: bead.image,
    colorHex: bead.colorHex,
    pricePerBead: bead.pricePerBead,
    powerUse: bead.powerUse,
    shortDescriptor: bead.shortDescriptor,
    reason: bead.reason,
  };
}

export function findBeadByName(beads, name) {
  if (!name) return null;
  const target = String(name).toLowerCase();
  return (beads || []).find((b) => String(b.name).toLowerCase() === target) || null;
}

function claspIndices(limit, want) {
  const out = [];
  let left = 0;
  let right = limit - 1;
  for (let k = 0; k < want; k += 1) {
    if (k % 2 === 0) out.push(left++);
    else out.push(right--);
  }
  return out;
}

function weaveRepeating(groups, limit) {
  const queues = groups
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length);
  const layout = new Array(limit).fill(null);
  let cursor = 0;
  let guard = 0;
  while (cursor < limit && guard < limit * 8) {
    guard += 1;
    let placed = false;
    for (const queue of queues) {
      if (!queue.length || cursor >= limit) continue;
      layout[cursor] = queue.shift();
      cursor += 1;
      placed = true;
    }
    if (!placed) break;
  }
  return layout;
}

export function buildLayout({ intentionBeads, mulank, beadLimit, zodiacBead, includeZodiac, zodiacQty }) {
  const limit = Math.max(1, Number(beadLimit) || 18);
  const crystals = (intentionBeads || []).filter(Boolean);
  if (!crystals.length) throw new Error('This intention has no crystals mapped yet.');

  const primary = crystals[0];
  const others = crystals.slice(1);
  const qtyPrimary = Math.min(Math.max(1, Number(mulank) || 1), limit);
  const remaining = Math.max(0, limit - qtyPrimary);

  const primaryQueue = Array.from({ length: qtyPrimary }, () => ({
    ...slimBead(primary),
    role: 'intention-primary',
  }));

  const otherQueues = [];
  if (others.length) {
    others.forEach(() => otherQueues.push([]));
    for (let i = 0; i < remaining; i += 1) {
      const bead = others[i % others.length];
      otherQueues[i % others.length].push({ ...slimBead(bead), role: 'intention' });
    }
  } else {
    for (let i = 0; i < remaining; i += 1) {
      primaryQueue.push({ ...slimBead(primary), role: 'intention' });
    }
  }

  const layout = weaveRepeating([primaryQueue, ...otherQueues], limit);

  if (includeZodiac && zodiacBead) {
    const want = Math.min(Math.max(1, Number(zodiacQty) || 2), limit - 1);
    claspIndices(limit, want).forEach((index) => {
      layout[index] = { ...slimBead(zodiacBead), role: 'zodiac' };
    });
  }

  return layout.map((slot, i) => ({ ...slot, position: i + 1 }));
}

export function quantitiesFromLayout(layout) {
  const map = new Map();
  layout.forEach((slot) => {
    const id = String(slot.beadId);
    if (!map.has(id)) {
      map.set(id, {
        beadId: slot.beadId,
        name: slot.name,
        slug: slot.slug,
        image: slot.image,
        colorHex: slot.colorHex,
        pricePerBead: slot.pricePerBead,
        powerUse: slot.powerUse,
        quantity: 0,
        roles: new Set(),
      });
    }
    const row = map.get(id);
    row.quantity += 1;
    row.roles.add(slot.role);
  });
  return [...map.values()].map((row) => ({ ...row, roles: [...row.roles] }));
}

export function quoteFromBeads(config, beads, finish) {
  const lines = (beads || []).map((b) => ({
    beadId: b.beadId || b._id,
    name: b.name,
    quantity: b.quantity,
    pricePerBead: b.pricePerBead,
    subtotal: b.quantity * b.pricePerBead,
    colorHex: b.colorHex,
    image: b.image,
    powerUse: b.powerUse,
    roles: b.roles,
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

export function calibrateLocal({
  dateOfBirth,
  intentionBeads,
  catalogBeads,
  config,
  finish,
  includeZodiac,
  zodiacQty,
}) {
  parseDateParts(dateOfBirth);
  const mulank = mulankFromDate(dateOfBirth);
  const bhagyank = bhagyankFromDate(dateOfBirth);
  const sign = zodiacFromDate(dateOfBirth);
  const pool = [...(catalogBeads || []), ...(intentionBeads || [])];
  const mulankMeta = MULANK_TABLE[mulank];
  const mulankCrystal = slimBead(findBeadByName(pool, mulankMeta?.beadName));
  const zodiacBead = slimBead(findBeadByName(pool, sign.beadName));
  const beadLimit = config?.beadLimit || 18;
  const parsed = Number(zodiacQty);
  const qtyZ = Number.isFinite(parsed) && parsed > 0 ? parsed : (config?.zodiacBeadCount || 2);
  const layout = buildLayout({
    intentionBeads,
    mulank,
    beadLimit,
    zodiacBead,
    includeZodiac: Boolean(includeZodiac),
    zodiacQty: qtyZ,
  });
  const beads = quantitiesFromLayout(layout);
  const qtyPrimary = layout.filter((s) => s.role === 'intention-primary').length;
  const explanation = [
    `Mulank ${mulank} sets the primary crystal count at ${qtyPrimary} on a ${beadLimit}-bead strand.`,
    `Those stones follow a fixed repeating pattern around the bracelet, starting at the charm.`,
    'The other crystals chosen for this intention fill the remaining positions in the same sequence.',
    includeZodiac && sign.sign ? `${sign.sign} beads (${qtyZ}) sit either side of the charm.` : '',
  ].filter(Boolean).join(' ');

  return {
    dateOfBirth,
    mulank,
    bhagyank,
    mulankCrystal: mulankCrystal ? { ...mulankCrystal, reason: mulankMeta.reason } : null,
    zodiac: {
      sign: sign.sign,
      slug: sign.slug,
      dateRange: dateRangeLabel(sign),
      reason: `${sign.sign} is paired with ${sign.beadName} for this bracelet’s zodiac beads.`,
      bead: zodiacBead,
    },
    intentionBeads: (intentionBeads || []).map(slimBead),
    layout,
    beads,
    includeZodiac: Boolean(includeZodiac),
    zodiacQty: qtyZ,
    explanation,
    quote: quoteFromBeads(config, beads, finish),
    local: true,
  };
}
