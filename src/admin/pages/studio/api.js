// Shared data helpers for the studio (customizer) admin pages: Beads, Intentions, StudioLayers, StudioConfig.
import { useApiQuery } from '../../lib/query';

export const STUDIO = '/customizer/admin';

/** Every studio write refreshes admin lists and the cached public customizer endpoints. */
export const STUDIO_INVALIDATE = ['/customizer/admin', '/customizer'];

/** All beads (active and hidden), sorted by name. GET /customizer/admin/beads → { beads } */
export function useStudioBeads(options) {
  const query = useApiQuery(`${STUDIO}/beads`, undefined, options);
  return { ...query, beads: query.data?.beads || [] };
}

/** Charms plus the bracelet config with defaults. GET /customizer/admin/charms → { charms, config } */
export function useStudioCharms(options) {
  const query = useApiQuery(`${STUDIO}/charms`, undefined, options);
  return { ...query, charms: query.data?.charms || [], config: query.data?.config || null };
}

/** Mirrors the backend's slugify(name, { lower, strict }) closely enough for duplicate detection. */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref) || '';

/** Adds stable client keys to editable rows (stripped again with stripKeys before sending). */
export function withKeys(rows, prefix = 'k') {
  return (Array.isArray(rows) ? rows : []).map((row, i) => ({ ...row, _k: `${prefix}${i}` }));
}

export function stripKeys(rows) {
  return (rows || []).map(({ _k, ...rest }) => rest);
}

export function newKey() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Move an item inside an array (returns a new array; no-op when out of range). */
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayMonth(month, day) {
  const m = MONTHS[Number(month) - 1];
  return m && day ? `${Number(day)} ${m}` : '—';
}

export function dateRange(row) {
  if (!row?.fromMonth || !row?.toMonth) return '';
  return `${dayMonth(row.fromMonth, row.fromDay)} – ${dayMonth(row.toMonth, row.toDay)}`;
}

/** Standard western zodiac signs with their usual date ranges (used to prefill forms). */
export const ZODIAC_SIGNS = [
  { sign: 'Aries', fromMonth: 3, fromDay: 21, toMonth: 4, toDay: 19 },
  { sign: 'Taurus', fromMonth: 4, fromDay: 20, toMonth: 5, toDay: 20 },
  { sign: 'Gemini', fromMonth: 5, fromDay: 21, toMonth: 6, toDay: 20 },
  { sign: 'Cancer', fromMonth: 6, fromDay: 21, toMonth: 7, toDay: 22 },
  { sign: 'Leo', fromMonth: 7, fromDay: 23, toMonth: 8, toDay: 22 },
  { sign: 'Virgo', fromMonth: 8, fromDay: 23, toMonth: 9, toDay: 22 },
  { sign: 'Libra', fromMonth: 9, fromDay: 23, toMonth: 10, toDay: 22 },
  { sign: 'Scorpio', fromMonth: 10, fromDay: 23, toMonth: 11, toDay: 21 },
  { sign: 'Sagittarius', fromMonth: 11, fromDay: 22, toMonth: 12, toDay: 21 },
  { sign: 'Capricorn', fromMonth: 12, fromDay: 22, toMonth: 1, toDay: 19 },
  { sign: 'Aquarius', fromMonth: 1, fromDay: 20, toMonth: 2, toDay: 18 },
  { sign: 'Pisces', fromMonth: 2, fromDay: 19, toMonth: 3, toDay: 20 },
];

export function stockState(bead) {
  const stock = Number(bead?.stock ?? 0);
  if (stock <= 0) return 'out';
  if (stock <= Number(bead?.lowStockLimit ?? 10)) return 'low';
  return 'ok';
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(v) {
  return HEX.test(v || '');
}

/** Returns an error message for an invalid day/month pair, or ''. */
export function checkDayMonth(month, day) {
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(m) || m < 1 || m > 12) return 'Choose a month.';
  const max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (!Number.isInteger(d) || d < 1 || d > max) return `Day must be 1–${max}.`;
  return '';
}
