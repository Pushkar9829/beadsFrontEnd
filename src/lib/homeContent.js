import { PAGES_DEFAULTS, FOOTER_DEFAULTS, CONTACT_DEFAULTS } from './sitePages';

export const HOME_DEFAULTS = {
  hero: {
    eyebrow: 'Energy · Abundance · Wellness',
    brandName: 'Kuberstones',
    title: 'Heal. Align. Attract abundance.',
    subtitle: 'Build a personal bracelet from purpose and intention — every crystal chosen with a reason.',
    image: '',
    imageAlt: 'Handmade crystal bracelet on the wrist',
    primaryCta: { label: 'Customization', to: '/customize' },
    secondaryCta: { label: 'Shop All', to: '/shop' },
  },
  marquee: [
    'Energy',
    'Abundance',
    'Wellness',
    'Crystals',
    'Rudraksha',
    'Gemstones',
    'Customization',
    'Handmade',
  ],
  houses: {
    eyebrow: 'The atelier',
    title: 'Three houses',
    body: 'Every collection lives in one of three houses. Enter any of them — or begin in the studio and compose a strand of your own.',
    items: [
      {
        slug: 'crystals',
        name: 'Crystals',
        roman: 'I',
        blurb: 'Strands composed for intention — colour, count, and character held with restraint.',
        image: '',
        cta: 'Enter the house →',
      },
      {
        slug: 'rudraksha',
        name: 'Rudraksha',
        roman: 'II',
        blurb: 'Sacred seed jewellery, quiet in silhouette and exact in its making.',
        image: '',
        cta: 'Enter the house →',
      },
      {
        slug: 'gemstones',
        name: 'Gemstones',
        roman: 'III',
        blurb: 'Cut stones and bracelet collections, set for light rather than noise.',
        image: '',
        cta: 'Enter the house →',
      },
    ],
  },
  studio: {
    eyebrow: 'The studio',
    title: 'Customization',
    body: 'Choose a purpose, then an intention. Crystals are placed from your Mulank, then closed with a Sriyantra or Om charm.',
    action: 'Open the studio →',
    to: '/customize',
    bannerImage: '',
    kicker: 'Begin a strand',
    heading: 'Compose your bracelet',
    copy: 'Purpose, intention, Mulank, zodiac, and a name — made to your wrist, not picked from a tray.',
    cta: 'Open the studio →',
  },
  ritual: {
    eyebrow: 'The ritual',
    title: 'How a strand is made',
    body: 'Four steps. No catalogue guesswork — the bracelet is composed in sequence, then made by hand.',
    steps: [
      { n: '01', title: 'Purpose', body: 'Begin with why you wear it — calm, abundance, protection, or love.' },
      { n: '02', title: 'Intention', body: 'Choose the feeling. Its crystals are selected for you, not guessed at checkout.' },
      { n: '03', title: 'Calibration', body: 'Your date of birth sets the Mulank. Counts are composed to that number.' },
      { n: '04', title: 'Charm', body: 'Sriyantra or Om at the clasp, on Korean elastic or sized steel core.' },
    ],
  },
  featured: {
    eyebrow: 'The collection',
    title: 'Featured pieces',
    body: 'Ready-made works from the three houses — for those who wish to choose rather than compose.',
    action: 'Shop all →',
    to: '/shop',
  },
  voices: {
    eyebrow: 'Voices',
    title: 'From those who wear it',
    body: 'Quiet notes from custom strands and the three houses — written without medical claims.',
  },
  testimonials: [],
  trust: {
    eyebrow: 'The house',
    title: 'Why Kuberstones',
    body: 'Crystal associations are traditional and spiritual. They are not medical claims. The making, however, is exact.',
  },
  trustClaims: [],
  finale: {
    image: '',
    kicker: 'Begin',
    title: 'A bracelet with a reason.',
    copy: 'Start with a purpose in the studio, or walk the three houses until a piece finds you.',
    primaryCta: { label: 'Customization', to: '/customize' },
    secondaryCta: { label: 'Shop All', to: '/shop' },
  },
  about: {
    headline: 'Jewellery as a quiet ritual',
    tagline: 'Editorial luxury for modern seekers.',
    body: '',
  },
  pages: PAGES_DEFAULTS,
  footer: FOOTER_DEFAULTS,
  contact: CONTACT_DEFAULTS,
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(fallback, stored) {
  if (stored == null || stored === '') return fallback;
  if (Array.isArray(fallback)) {
    return Array.isArray(stored) && stored.length ? stored : fallback;
  }
  if (isPlainObject(fallback)) {
    const out = { ...fallback };
    Object.keys({ ...fallback, ...stored }).forEach((key) => {
      out[key] = mergeDeep(fallback[key], stored[key]);
    });
    return out;
  }
  return stored;
}

export function pickHome(content) {
  const merged = mergeDeep(HOME_DEFAULTS, content && typeof content === 'object' ? content : {});
  if (content?._id) merged._id = content._id;
  if (content?.key) merged.key = content.key;
  return merged;
}

export function fillCopy(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

export function houseMeta(content, slug) {
  const items = content?.houses?.items || HOME_DEFAULTS.houses.items;
  return items.find((item) => item.slug === slug) || null;
}
