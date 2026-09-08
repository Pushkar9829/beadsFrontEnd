export function formatInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function parseWristInches(size = '6.5"') {
  const n = parseFloat(String(size).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 6.5;
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
