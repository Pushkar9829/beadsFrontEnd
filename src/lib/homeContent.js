import { PAGES_DEFAULTS, FOOTER_DEFAULTS, CONTACT_DEFAULTS } from './sitePages';
import { ABOUT_BRAND } from './aboutBrand';

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
  brand: {
    name: 'KUBERSTONES',
    tagline: 'Personalized With Purpose',
    logo: '',
    customizeLabel: 'Customization',
    collectionsLabel: 'Collections',
    shopAllLabel: 'Shop All',
  },
  purpose: {
    eyebrow: 'Purpose',
    title: 'Shop by purpose',
    body: 'Begin with why you wear it. Each purpose opens the studio with that intention already chosen.',
    action: 'All purposes →',
    to: '/customize/purpose',
    pageEyebrow: 'Studio',
    pageTitle: 'Shop by purpose',
    pageBody: 'Choose the reason first. The studio then places crystals for that intention.',
  },
  rails: {
    bestsellers: { eyebrow: 'Collection', title: 'Best sellers', action: 'See all →', to: '/collection/best-sellers' },
    newArrivals: { eyebrow: 'Collection', title: 'New arrivals', action: 'See all →', to: '/collection/new-arrivals' },
    trending: { eyebrow: 'Collection', title: 'Trending bracelets', action: 'See all →', to: '/collection/trending' },
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions, answered',
    action: 'All questions →',
    to: '/faq',
    pageEyebrow: 'Care',
    pageTitle: 'Questions, answered quietly.',
    pageBody: '',
    emptyBody: 'No questions published yet.',
  },
  journal: {
    eyebrow: 'Journal',
    title: 'From the atelier',
    action: 'All notes →',
    to: '/journal',
    pageEyebrow: 'Journal',
    pageTitle: 'From the atelier',
    pageBody: 'Quiet writing on stones, ritual, and making.',
    emptyBody: 'No journal entries yet.',
  },
  flash: {
    label: 'Flash sale',
    body: 'Timed prices on a short list. When the clock ends, the atelier rate returns.',
    action: 'Shop the sale →',
    to: '/sale',
    pageBody: 'Timed prices. When the clock ends, the list returns to the atelier rate.',
    emptyTitle: 'No sale is running.',
    emptyBody: 'When a flash sale is live, timed prices will appear here.',
    emptyProducts: 'Products for this sale are being placed.',
  },
  newsletter: {
    eyebrow: 'The list',
    title: 'Quiet notes from the atelier.',
    compactTitle: 'The list.',
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
    eyebrow: ABOUT_BRAND.eyebrow,
    headline: ABOUT_BRAND.headline,
    tagline: ABOUT_BRAND.tagline,
    intro: ABOUT_BRAND.intro,
    body: '',
    moreTitle: ABOUT_BRAND.moreTitle,
    moreBody: ABOUT_BRAND.moreBody,
    morePoints: ABOUT_BRAND.morePoints,
    moreClose: ABOUT_BRAND.moreClose,
    collectionsTitle: ABOUT_BRAND.collectionsTitle,
    collections: ABOUT_BRAND.collections,
    differentTitle: ABOUT_BRAND.differentTitle,
    different: ABOUT_BRAND.different,
    approachTitle: ABOUT_BRAND.approachTitle,
    approachKicker: ABOUT_BRAND.approachKicker,
    approachBody: ABOUT_BRAND.approachBody,
    approachNote: ABOUT_BRAND.approachNote,
    steps: ABOUT_BRAND.steps,
    visionTitle: ABOUT_BRAND.visionTitle,
    vision: ABOUT_BRAND.vision,
    promiseTitle: ABOUT_BRAND.promiseTitle,
    promises: ABOUT_BRAND.promises,
    closeLine: ABOUT_BRAND.closeLine,
    closeEntity: ABOUT_BRAND.closeEntity,
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
    return Array.isArray(stored) ? stored : fallback;
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

export const HOME_LAYOUT_DEFAULTS = [
  { key: 'hero', label: 'Hero banner', enabled: true, sortOrder: 0 },
  { key: 'flash_sale', label: 'Flash sale', enabled: true, sortOrder: 1 },
  { key: 'marquee', label: 'Marquee', enabled: true, sortOrder: 2 },
  { key: 'houses', label: 'Featured categories', enabled: true, sortOrder: 3 },
  { key: 'studio', label: 'Studio invite', enabled: true, sortOrder: 4 },
  { key: 'shop_by_purpose', label: 'Shop by purpose', enabled: true, sortOrder: 5 },
  { key: 'ritual', label: 'Ritual steps', enabled: true, sortOrder: 6 },
  { key: 'featured', label: 'Featured products', enabled: true, sortOrder: 7 },
  { key: 'bestsellers', label: 'Best sellers', enabled: true, sortOrder: 8 },
  { key: 'new_arrivals', label: 'New arrivals', enabled: true, sortOrder: 9 },
  { key: 'trending', label: 'Trending bracelets', enabled: true, sortOrder: 10 },
  { key: 'testimonials', label: 'Testimonials', enabled: true, sortOrder: 11 },
  { key: 'trust', label: 'Trust claims', enabled: true, sortOrder: 12 },
  { key: 'faq', label: 'FAQ', enabled: true, sortOrder: 13 },
  { key: 'journal', label: 'Journal', enabled: true, sortOrder: 14 },
  { key: 'newsletter', label: 'Newsletter', enabled: true, sortOrder: 15 },
  { key: 'finale', label: 'Finale', enabled: true, sortOrder: 16 },
];

export function mergeHomeLayout(stored) {
  const byKey = new Map((Array.isArray(stored) ? stored : []).map((s) => [s.key, s]));
  return HOME_LAYOUT_DEFAULTS.map((def) => {
    const extra = byKey.get(def.key) || {};
    return {
      ...def,
      ...extra,
      key: def.key,
      label: extra.label || def.label,
      enabled: extra.enabled !== false,
      sortOrder: extra.sortOrder ?? def.sortOrder,
      startsAt: extra.startsAt || null,
      endsAt: extra.endsAt || null,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function pickHome(content) {
  const merged = mergeDeep(HOME_DEFAULTS, content && typeof content === 'object' ? content : {});
  if (content?._id) merged._id = content._id;
  if (content?.key) merged.key = content.key;
  merged.homeLayout = mergeHomeLayout(content?.homeLayout);
  return merged;
}

export function fillCopy(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

export function houseMeta(content, slug) {
  const items = content?.houses?.items || HOME_DEFAULTS.houses.items;
  return items.find((item) => item.slug === slug) || null;
}
