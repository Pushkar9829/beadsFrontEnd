// Storefront pages, studio copy and legal pages (all live under `about` / `pages.*`).
import { STUDIO_FLOW } from '../../../lib/studioFlow';
import { area, color, emptyState, group, linkPair, list, media, note, row, strings, text } from './schema';
import { getPath, setPath } from '../../ui';

const eyebrowTitle = () => row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]);
const authFields = [
  eyebrowTitle(),
  area('body', 'Body'),
  linkPair(),
  row([text('cardKicker', 'Card kicker'), text('cardTitle', 'Card title')]),
  row([text('submitLabel', 'Submit label'), text('submitBusy', 'Busy label')]),
  row([text('footer', 'Footer text'), text('footerLink', 'Footer link text')]),
];
const bagFields = [
  eyebrowTitle(),
  area('emptyBody', 'Body when empty'),
  area('filledBody', 'Body with items', { hint: '{count} and {pieces} are filled in automatically.' }),
  linkPair(),
  emptyState(),
];

export const PAGE_SECTIONS = [
  {
    key: 'about',
    label: 'About copy',
    group: 'Pages',
    hint: 'About page text',
    preview: '/about',
    base: 'about',
    fields: [
      row([text('eyebrow', 'Eyebrow'), text('tagline', 'Tagline')]),
      text('headline', 'Headline'),
      strings('intro', 'Intro paragraphs', { multiline: true, itemLabel: 'Paragraph' }),
      area('body', 'Extra body', { rows: 6 }),
      group('More than a bracelet', [text('moreTitle', 'Title'), area('moreBody', 'Body'), strings('morePoints', 'Points', { itemLabel: 'Point' }), area('moreClose', 'Closing paragraph')]),
      group('Collections', [
        text('collectionsTitle', 'Title'),
        list('collections', 'Collections', [row([text('name', 'Name'), text('to', 'Link', { placeholder: '/path' })]), area('body', 'Body', { rows: 2 })], {
          itemLabel: 'Collection',
          summary: (c) => c.name,
          newItem: { name: '', to: '', body: '' },
        }),
      ]),
      group('What makes us different', [
        text('differentTitle', 'Title'),
        list('different', 'Points', [text('title', 'Title'), area('body', 'Body', { rows: 2 })], {
          itemLabel: 'Difference',
          summary: (c) => c.title,
          newItem: { title: '', body: '' },
        }),
      ]),
      group('Approach', [
        row([text('approachTitle', 'Eyebrow'), text('approachKicker', 'Title')]),
        area('approachBody', 'Body'),
        area('approachNote', 'Note'),
        list('steps', 'Steps', [row([text('n', 'Number'), text('title', 'Title')]), area('body', 'Body', { rows: 2 })], {
          itemLabel: 'Step',
          summary: (s) => s.title,
          newItem: (items) => ({ n: String(items.length + 1).padStart(2, '0'), title: '', body: '' }),
        }),
      ]),
      group('Vision & promise', [text('visionTitle', 'Vision title'), area('vision', 'Vision'), text('promiseTitle', 'Promise title'), strings('promises', 'Promises', { itemLabel: 'Promise' })]),
      group('Closing', [text('closeLine', 'Close line'), text('closeEntity', 'Close entity')]),
    ],
  },
  {
    key: 'pageAbout',
    label: 'About layout',
    group: 'Pages',
    hint: 'About page image and link',
    preview: '/about',
    base: 'pages.aboutPage',
    fields: [text('eyebrow', 'Eyebrow'), linkPair(), media('image', 'Portrait image', { aspect: 'aspect-[3/4]' })],
  },
  {
    key: 'pageCollections',
    label: 'Collections index',
    group: 'Pages',
    hint: 'Collections listing page',
    preview: '/collections',
    base: 'pages.collections',
    fields: [eyebrowTitle(), area('body', 'Body'), text('action', 'Card link label'), emptyState()],
  },
  {
    key: 'pageShop',
    label: 'Shop All',
    group: 'Pages',
    hint: 'Shop page',
    preview: '/shop',
    base: 'pages.shop',
    fields: [eyebrowTitle(), area('body', 'Body'), area('familyBody', 'Body when filtered by house', { hint: '{house} is filled in automatically.' }), linkPair(), emptyState()],
  },
  {
    key: 'pageFamily',
    label: 'House pages',
    group: 'Pages',
    hint: 'Crystals / Rudraksha / Gemstones',
    preview: '/crystals',
    base: 'pages.family',
    fields: [
      linkPair('shopAction', 'shopTo', 'Shop '),
      row([text('piecesEyebrow', 'Pieces eyebrow'), text('piecesTitle', 'Pieces title')]),
      area('piecesBody', 'Pieces body', { hint: '{count} and {pieces} are filled in automatically.' }),
      linkPair('piecesAction', 'piecesTo', 'Pieces '),
      emptyState(),
    ],
  },
  {
    key: 'pageCategory',
    label: 'Category pages',
    group: 'Pages',
    hint: 'Category empty / missing states',
    preview: '/shop',
    base: 'pages.category',
    fields: [linkPair(), emptyState('missing', 'Category not found'), emptyState('empty', 'Category without pieces')],
  },
  {
    key: 'pageProduct',
    label: 'Product missing',
    group: 'Pages',
    hint: 'When a piece is gone',
    preview: '/p/this-piece-does-not-exist',
    base: 'pages.product',
    fields: [emptyState('missing', 'Product not found')],
  },
  { key: 'pageCart', label: 'Bag', group: 'Pages', hint: 'Cart page', preview: '/cart', base: 'pages.cart', fields: bagFields },
  { key: 'pageWishlist', label: 'Wishlist', group: 'Pages', hint: 'Wishlist page', preview: '/wishlist', base: 'pages.wishlist', fields: bagFields },
  {
    key: 'pageCheckout',
    label: 'Checkout',
    group: 'Pages',
    hint: 'Checkout page',
    preview: '/checkout',
    base: 'pages.checkout',
    fields: [
      text('title', 'Title'),
      area('body', 'Body'),
      row([text('emptyTitle', 'Empty title'), text('emptyBody', 'Empty body')]),
      row([text('submitLabel', 'Submit label'), text('submitBusy', 'Busy label')]),
      text('summaryTitle', 'Summary title'),
    ],
  },
  { key: 'pageLogin', label: 'Sign in', group: 'Pages', hint: 'Login page', preview: '/login', base: 'pages.login', fields: authFields },
  { key: 'pageRegister', label: 'Create account', group: 'Pages', hint: 'Register page', preview: '/register', base: 'pages.register', fields: authFields },
  {
    key: 'pageAccount',
    label: 'Account',
    group: 'Pages',
    hint: 'Account page',
    preview: '/account',
    base: 'pages.account',
    fields: [
      eyebrowTitle(),
      area('guestBody', 'Guest body'),
      linkPair(),
      row([text('cardKicker', 'Card kicker'), text('cardTitle', 'Card title')]),
      group('Orders', [
        row([text('ordersEyebrow', 'Eyebrow'), text('ordersTitle', 'Title')]),
        text('ordersLoading', 'Loading message'),
        area('ordersEmptyBody', 'Body without orders'),
        area('ordersFilledBody', 'Body with orders', { hint: '{count} and {orders} are filled in automatically.' }),
        text('ordersAction', 'Link label'),
      ]),
      group('Order placed', [text('placedKicker', 'Kicker'), area('placedBody', 'Body', { hint: '{number} is the order number.' })]),
      emptyState(),
    ],
  },
  {
    key: 'pageNotFound',
    label: '404',
    group: 'Pages',
    hint: 'Missing page',
    preview: '/this-page-does-not-exist',
    base: 'pages.notFound',
    fields: [text('title', 'Title'), area('body', 'Body'), row([text('cta', 'Button label'), text('to', 'Button link', { placeholder: '/' })])],
  },
];

// ---- Studio -----------------------------------------------------------------------------------

const STUDIO_LABEL_GROUPS = [
  ['Choose step', [['changeLabel', 'Change button'], ['intentionCount', 'Intention counter · {count} {cap}'], ['pickOne', 'Pick one hint'], ['pickUpTo', 'Pick up to hint · {cap}'], ['emptyPurposes', 'No purposes message'], ['emptyLayer', 'Empty catalog message']]],
  ['Numerology', [['birthKicker', 'Birth date heading'], ['birthBody', 'Birth date help', true], ['mulankLabel', 'Mulank heading'], ['bhagyankLabel', 'Bhagyank heading'], ['bhagyankBody', 'Bhagyank help', true]]],
  [
    'Crystals step',
    [
      ['crystalCount', 'Crystal counter · {count} {max}'],
      ['beadTotal', 'Bead total · {count}'],
      ['perBead', 'Per-bead price suffix'],
      ['addCrystal', 'Add crystal button'],
      ['catalogKicker', 'Catalog pop-up kicker'],
      ['catalogTitle', 'Catalog pop-up title'],
      ['catalogFull', 'Crystal limit reached', true],
      ['crystalNote', 'Footnote'],
      ['crystalsMissing', 'No crystals message', true],
    ],
  ],
  ['Fit step', [['beadSizeLabel', 'Bead size heading'], ['wristLabel', 'Wrist size heading'], ['wristElasticSuffix', 'Elastic thread wrist suffix'], ['threadLabel', 'Thread heading'], ['fitSummary', 'Summary line · {count} {size} {wrist}']]],
  ['Finish step', [['charmLabel', 'Charm heading'], ['charmsLoading', 'Charms loading message'], ['finishLabel', 'Finish heading'], ['czLabel', 'CZ heading'], ['nameLabel', 'Name heading'], ['nameBody', 'Name help', true], ['namePlaceholder', 'Name placeholder']]],
  [
    'Bottom bar and ordering',
    [
      ['backLabel', 'Back button'],
      ['stepCounter', 'Step counter · {step} {total}'],
      ['beadsUnit', 'Word for "beads"'],
      ['nextChoose', 'Next button on Choose'],
      ['nextCrystals', 'Next button on Crystals'],
      ['nextFit', 'Next button on Fit'],
      ['nextFinish', 'Next button on Finish'],
      ['placeOrder', 'Place order button'],
      ['placingOrder', 'Placing order label'],
      ['charmMissing', 'No charm chosen error'],
      ['orderFailed', 'Order failed error'],
    ],
  ],
  [
    'Preview and review',
    [
      ['previewToggle', 'Mobile preview toggle'],
      ['previewKicker', 'Preview kicker'],
      ['selectionPending', 'Nothing chosen yet'],
      ['customStrand', 'Fallback bracelet name'],
      ['liveTotal', 'Live total label'],
      ['editSelection', 'Edit selection button'],
      ['editCrystals', 'Edit crystals button'],
      ['clearBuild', 'Clear button'],
      ['reviewKicker', 'Review kicker'],
      ['rowPath', 'Review row: path'],
      ['rowIntention', 'Review row: intention'],
      ['rowDob', 'Review row: date of birth'],
      ['rowZodiac', 'Review row: zodiac'],
      ['rowBeadSize', 'Review row: bead size'],
      ['rowCharm', 'Review row: charm'],
      ['rowWrist', 'Review row: wrist'],
      ['rowPersonalise', 'Review row: name'],
      ['totalLabel', 'Total label'],
    ],
  ],
  [
    'Crystal details drawer',
    [
      ['drawerKicker', 'Kicker'],
      ['drawerPower', 'Power / use heading'],
      ['drawerBenefits', 'Benefits heading'],
      ['drawerChakra', 'Chakra heading'],
      ['drawerReason', 'Why recommended heading'],
      ['drawerOrigin', 'Origin heading'],
      ['drawerSpec', 'Specification heading'],
      ['drawerCare', 'Care heading'],
    ],
  ],
];

const STUDIO_THEME_FIELDS = [
  ['pageBg', 'Page background'],
  ['cardBg', 'Option card background'],
  ['cardBorder', 'Option card border'],
  ['cardText', 'Option card title text'],
  ['cardMuted', 'Option card detail text'],
  ['accent', 'Selected / accent colour'],
  ['selectedBg', 'Selected card base'],
  ['kicker', 'Section heading colour'],
  ['dockBg', 'Bottom bar background'],
];

/** CMS step copy is matched to the studio flow by id, so steps never shift onto the wrong screen. */
function customizeSteps(stored) {
  return STUDIO_FLOW.map((entry) => {
    const r = (Array.isArray(stored) ? stored : []).find((s) => s?.id === entry.id) || {};
    return { id: entry.id, eyebrow: r.eyebrow || entry.eyebrow || '', title: r.title || entry.title || '', body: r.body || entry.body || '', hint: r.hint || '' };
  });
}

const pairs = (fields) => {
  const out = [];
  for (let i = 0; i < fields.length; i += 2) out.push(fields[i + 1] ? row([fields[i], fields[i + 1]]) : fields[i]);
  return out;
};

export const STUDIO_SECTIONS = [
  {
    key: 'pageCustomize',
    label: 'Customization steps',
    group: 'Studio',
    hint: 'Heading of each studio step',
    preview: '/customize',
    base: 'pages.customize.steps',
    prepare: (values) => setPath(values, 'pages.customize.steps', customizeSteps(getPath(values, 'pages.customize.steps'))),
    fields: [
      list('', 'Steps', [row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]), area('body', 'Body', { rows: 2 }), text('hint', 'Hint')], {
        fixed: true,
        reorder: false,
        itemTitle: (s, i) => `Step ${i + 1} · ${STUDIO_FLOW.find((f) => f.id === s.id)?.label || s.id}`,
      }),
    ],
  },
  {
    key: 'studioLabels',
    label: 'Studio text',
    group: 'Studio',
    hint: 'Headings, buttons and messages',
    preview: '/customize',
    base: 'pages.customize.labels',
    fields: [
      note('Words in {braces} are filled in automatically. Leave a field empty to use the default.'),
      ...STUDIO_LABEL_GROUPS.map(([title, fields]) => group(title, pairs(fields.map(([k, label, long]) => (long ? area(k, label, { rows: 2 }) : text(k, label)))))),
    ],
  },
  {
    key: 'studioTheme',
    label: 'Studio colours',
    group: 'Studio',
    hint: 'Page, cards, selected state, bottom bar',
    preview: '/customize',
    base: 'pages.customize.theme',
    fields: [
      note('Applies to the customization studio only. Purpose, intention and layer cards keep their own colours (set on Intentions and Studio layers); the accent colour still marks the chosen card. Empty means the built-in look.'),
      ...pairs(STUDIO_THEME_FIELDS.map(([k, label]) => color(k, label))),
      media('pageBgImage', 'Page background image', { folder: 'studio' }),
    ],
  },
];

// ---- Legal --------------------------------------------------------------------------------------

const LEGAL = [
  ['returns', 'Returns'],
  ['exchanges', 'Exchanges'],
  ['refunds', 'Refunds'],
  ['shipping', 'Shipping'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['maintenance', 'Maintenance'],
  ['grievance', 'Contact & grievance'],
];

export const LEGAL_SECTIONS = LEGAL.map(([kind, label]) => ({
  key: `legal${kind[0].toUpperCase()}${kind.slice(1)}`,
  label,
  group: 'Legal',
  hint: `/${kind}`,
  preview: `/${kind}`,
  base: `pages.legal.${kind}`,
  fields: [
    eyebrowTitle(),
    area('body', 'Introduction'),
    list('sections', 'Sections', [text('heading', 'Heading'), area('body', 'Body', { rows: 5 })], {
      itemLabel: 'Section',
      summary: (s) => s.heading,
      newItem: { heading: '', body: '' },
    }),
    ...(kind === 'grievance' ? [note('Company name, phone, address and grievance officer come from the Footer section.')] : []),
  ],
}));
