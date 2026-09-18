let activeCurrency = 'INR';

export function setStoreCurrency(code) {
  const next = String(code || 'INR').trim().toUpperCase();
  activeCurrency = /^[A-Z]{3}$/.test(next) ? next : 'INR';
}

export function formatInr(value) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: activeCurrency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
}

export function parseWristInches(size = '6.5"') {
  const n = parseFloat(String(size).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 6.5;
}

export const THREAD_TYPES = [
  { key: 'korean-elastic', label: 'Korean elastic thread', detail: 'Free-size fit' },
  { key: 'steel-core', label: 'Steel core thread', detail: 'Cut to your wrist size' },
];

export function strandBeadCount(wristSize, beadSizeMm, { min = 8, max = 32 } = {}) {
  const inches = parseWristInches(wristSize);
  const mm = Number(beadSizeMm) || 8;
  const count = Math.round((inches * 25.4) / mm);
  return Math.max(min, Math.min(max, count));
}

export function formatWristChoice(threadType, wristSize, threadTypes) {
  const row = (threadTypes || THREAD_TYPES).find((t) => t.key === threadType);
  if (row) return `${row.label} · ${wristSize || '6.5"'}${row.detail ? ` (${row.detail})` : ''}`;
  if (threadType === 'steel-core') {
    return `Steel core thread · ${wristSize || '6.5"'}`;
  }
  return `Korean elastic thread · ${wristSize || '6.5"'} (free-size fit)`;
}

export const FAMILIES = [
  {
    slug: 'crystals',
    name: 'Crystals',
    roman: 'I',
    blurb: 'Strands composed for intention — colour, count, and character held with restraint.',
  },
  {
    slug: 'rudraksha',
    name: 'Rudraksha',
    roman: 'II',
    blurb: 'Sacred seed jewellery, quiet in silhouette and exact in its making.',
  },
  {
    slug: 'gemstones',
    name: 'Gemstones',
    roman: 'III',
    blurb: 'Cut stones and bracelet collections, set for light rather than noise.',
  },
];
