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
  { slug: 'crystals', name: 'Crystals', blurb: 'Bracelet collections and crystal-based pieces.' },
  { slug: 'rudraksha', name: 'Rudraksha', blurb: 'Sacred seed jewellery, composed with restraint.' },
  { slug: 'gemstones', name: 'Gemstones', blurb: 'Cut stones and bracelet collections.' },
];
