// Gold line emblems for purposes (and anything that shares their keywords), drawn to sit
// with the Nocturne look. Matched the same way as the original artwork in PurposeGrid.
import { mediaUrl } from '../../api/client';

const EMBLEMS = [
  {
    key: 'love',
    match: /love|relation/i,
    d: 'M32 46 C22 39 16 33 16 26 A8.4 8.4 0 0 1 32 22 A8.4 8.4 0 0 1 48 26 C48 33 42 39 32 46 Z M32 38 C28.5 35.5 26 33 26 30.5 A3.1 3.1 0 0 1 32 29.5 A3.1 3.1 0 0 1 38 30.5 C38 33 35.5 35.5 32 38 Z',
  },
  {
    key: 'money',
    match: /money|abund|prosper|wealth/i,
    d: 'M22 26 L27 19 H37 L42 26 L32 46 Z M22 26 H42 M27 19 L30 26 L32 46 M37 19 L34 26 L32 46 M46 16 V20 M44 18 H48 M18 38 V41 M16.5 39.5 H19.5',
  },
  {
    key: 'career',
    match: /career|success/i,
    d: 'M18 40 L20 25 L27 32 L32 21 L37 32 L44 25 L46 40 Z M18 45 H46 M24 36 H40',
    dots: [[20, 25], [32, 21], [44, 25]],
  },
  {
    key: 'confidence',
    match: /confidence|power/i,
    d: 'M32 47 C24 47 20 41 21 35 C22 29 27 27 28 19 C33 23 36 27 35 32 C38 30 39 27 39 25 C43 30 44 35 42 40 C40 44 36 47 32 47 Z M32 47 C29 47 27 44 28 41 C29 38 32 37 32 34 C35 37 36 40 35 43 C34 45 33 47 32 47 Z',
  },
  {
    key: 'protection',
    match: /protect|ground/i,
    d: 'M32 17 L45 22 V31 C45 39 39 44 32 47 C25 44 19 39 19 31 V22 Z M32 23 L40 26 V31 C40 36 36.5 39.5 32 41.5 C27.5 39.5 24 36 24 31 V26 Z',
  },
  {
    key: 'focus',
    match: /focus|clarit/i,
    d: 'M15 32 C20 24 26 21 32 21 C38 21 44 24 49 32 C44 40 38 43 32 43 C26 43 20 40 15 32 Z',
    circles: [[32, 32, 6]],
    dots: [[32, 32]],
  },
  {
    key: 'calm',
    match: /calm|emotion/i,
    d: 'M32 19 C36.5 25 36.5 35 32 42 C27.5 35 27.5 25 32 19 Z M32 42 C25 41 19.5 35 18.5 27.5 C25 28.5 30 34 32 42 Z M32 42 C39 41 44.5 35 45.5 27.5 C39 28.5 34 34 32 42 Z M20 46.5 H44',
  },
  {
    key: 'sleep',
    match: /sleep|relax/i,
    d: 'M33 19 A13.5 13.5 0 1 0 33 45 A16 16 0 0 1 33 19 Z M42 21 L43 23.5 L45.5 24.5 L43 25.5 L42 28 L41 25.5 L38.5 24.5 L41 23.5 Z M46 33 V36 M44.5 34.5 H47.5',
  },
  {
    key: 'energy',
    match: /energy|vital|courage|strength|passion/i,
    d: 'M43 32 L48 32 M39.8 39.8 L43.3 43.3 M32 43 L32 48 M24.2 39.8 L20.7 43.3 M21 32 L16 32 M24.2 24.2 L20.7 20.7 M32 21 L32 16 M39.8 24.2 L43.3 20.7',
    circles: [[32, 32, 7]],
  },
  {
    key: 'spirit',
    match: /spirit/i,
    d: 'M32 17 L34.1 26.9 L42.6 21.4 L37.1 29.9 L47 32 L37.1 34.1 L42.6 42.6 L34.1 37.1 L32 47 L29.9 37.1 L21.4 42.6 L26.9 34.1 L17 32 L26.9 29.9 L21.4 21.4 L29.9 26.9 Z',
    circles: [[32, 32, 2.5]],
  },
  {
    key: 'begin',
    match: /begin/i,
    d: 'M32 46 V29 M32 35 C26 35 21 31 20 24 C27 24 31 28 32 35 Z M32 30 C33 23 38 19 45 19 C45 26 40 30 32 30 Z M22 46 H42',
  },
  {
    key: 'communication',
    match: /communicat|express/i,
    d: 'M20 21 H44 A3 3 0 0 1 47 24 V35 A3 3 0 0 1 44 38 H30 L24 44 V38 H20 A3 3 0 0 1 17 35 V24 A3 3 0 0 1 20 21 Z M23.5 27 H40.5 M23.5 32 H35',
  },
  {
    key: 'balance',
    match: /balance/i,
    d: 'M32 20 V45 M25 45 H39 M18 25 H46 M18 25 L14 35 M18 25 L22 35 M14 35 A4 2.6 0 0 0 22 35 Z M46 25 L42 35 M46 25 L50 35 M42 35 A4 2.6 0 0 0 50 35 Z',
    circles: [[32, 18.5, 1.6]],
  },
];

// A plain crystal point for anything that matches no keyword.
const CRYSTAL = {
  key: 'crystal',
  d: 'M32 16 L40 24 V41 L32 48 L24 41 V24 Z M24 24 L32 29 L40 24 M32 29 V48',
};

// The bundled 3D artwork that used to ship with the seed data. Anything else uploaded
// in admin is the client's own choice and is shown as is.
const LEGACY_ART = /\/(love-3d|purpose-[a-z]+)\.png$/i;

function haystack(item) {
  return `${item?.slug || ''} ${item?.name || ''} ${item?.theme || ''}`;
}

export function emblemFor(item) {
  return EMBLEMS.find((e) => e.match.test(haystack(item))) || CRYSTAL;
}

export function hasCustomArt(item) {
  return Boolean(item?.image) && !LEGACY_ART.test(String(item.image));
}

export function Emblem({ item, className = '' }) {
  const e = emblemFor(item);
  return (
    <svg viewBox="0 0 64 64" className={`nx-emblem ${className}`} fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="32" cy="32" r="29.5" className="nx-emblem-ring" />
      <path d={e.d} />
      {(e.circles || []).map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
      {(e.dots || []).map(([cx, cy]) => (
        <circle key={`d${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

/** The client's own upload when there is one, otherwise the matching emblem. */
export default function PurposeArt({ item }) {
  if (hasCustomArt(item)) return <img src={mediaUrl(item.image)} alt="" />;
  return <Emblem item={item} />;
}
