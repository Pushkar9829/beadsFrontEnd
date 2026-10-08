// Storefront pages, studio copy and legal pages (all live under `about` / `pages.*`).
import { STUDIO_STEPS } from '../../../lib/studioFlow';
import { area, emptyState, group, linkPair, list, media, note, row, strings, text } from './schema';
import { getPath, setPath } from '../../ui';

const eyebrowTitle = () => row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]);
const authFields = [
  eyebrowTitle(),
  area('body', 'Body'),
  linkPair(),
  row([text('cardKicker', 'Card kicker'), text('cardTitle', 'Card title')]),
  row([text('submitLabel', 'Submit label'), text('submitBusy', 'Busy label')]),
  row([text('footer', 'Footer text'), text('footerLink', 'Footer link text')]),
  media('image', 'Side photo', { folder: 'banner', aspect: 'aspect-[4/5]', hint: 'Leave empty to use the built-in photo.' }),
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
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      text('action', 'Card link label'),
      media('image', 'Banner image', { folder: 'banner', hint: 'Leave empty to use the built-in photo.' }),
      group('On a single collection page', [row([text('inEyebrow', 'Pieces eyebrow', { placeholder: 'In this collection' }), text('moreTitle', 'Other collections heading', { placeholder: 'More collections' })])]),
      emptyState(),
    ],
  },
  {
    key: 'pageShop',
    label: 'Shop All',
    group: 'Pages',
    hint: 'Shop page',
    preview: '/shop',
    base: 'pages.shop',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      area('familyBody', 'Body when filtered by house', { hint: '{house} is filled in automatically.' }),
      linkPair(),
      row([text('listEyebrow', 'Pieces eyebrow', { placeholder: 'Every house' }), text('listTitle', 'Pieces title', { placeholder: 'All pieces' })]),
      media('image', 'Banner image', { folder: 'banner', hint: 'Used for "all pieces". A house filter shows the image of that house (set under Homepage → Houses).' }),
      emptyState(),
    ],
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
      row([text('tilesEyebrow', 'Collections eyebrow', { placeholder: 'Inside the house' }), text('backLabel', 'Back link', { placeholder: 'Back to all houses' })]),
      emptyState(),
    ],
  },
  {
    key: 'pageCategory',
    label: 'Category pages',
    group: 'Pages',
    hint: 'Headings and empty / missing states',
    preview: '/shop',
    base: 'pages.category',
    fields: [
      linkPair(),
      row([text('listTitle', 'Pieces title', { placeholder: 'The pieces' }), text('moreEyebrow', 'Related collections eyebrow', { placeholder: 'More from this house' })]),
      emptyState('missing', 'Category not found'),
      emptyState('empty', 'Category without pieces'),
    ],
  },
  {
    key: 'pageProduct',
    label: 'Product page',
    group: 'Pages',
    hint: 'Shipping & returns text, related pieces heading, missing-piece state',
    preview: '/p/this-piece-does-not-exist',
    base: 'pages.product',
    fields: [
      group('Shipping & returns (on every product)', [
        text('shippingTitle', 'Heading', { placeholder: 'Shipping & returns' }),
        area('shippingBody', 'Text', { rows: 3, hint: 'Shown above the links to the shipping, returns and exchanges policies.' }),
      ]),
      row([text('relatedEyebrow', '"You may also like" eyebrow', { placeholder: 'Worn alongside' }), text('relatedTitle', '"You may also like" title', { placeholder: 'You may also like' })]),
      emptyState('missing', 'Product not found'),
    ],
  },
  {
    key: 'pageCart',
    label: 'Bag',
    group: 'Pages',
    hint: 'Cart page',
    preview: '/cart',
    base: 'pages.cart',
    fields: [...bagFields, row([text('summaryKicker', 'Summary kicker', { placeholder: 'To pay' }), text('summaryTitle', 'Summary title', { placeholder: 'Checkout.' })])],
  },
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
      group('Orders', [
        row([text('ordersEyebrow', 'Eyebrow'), text('ordersTitle', 'Title')]),
        text('ordersLoading', 'Loading message'),
        area('ordersEmptyBody', 'Body without orders'),
        area('ordersFilledBody', 'Body with orders', { hint: '{count} and {orders} are filled in automatically.' }),
        row([text('ordersAction', 'Link label'), text('ordersTo', 'Link', { placeholder: '/customize' })]),
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
    fields: [
      text('title', 'Title'),
      area('body', 'Body'),
      row([text('cta', 'Button label'), text('to', 'Button link', { placeholder: '/' })]),
      media('image', 'Banner image', { folder: 'banner', hint: 'Leave empty to use the built-in photo.' }),
    ],
  },
];

// ---- Studio -----------------------------------------------------------------------------------

const STUDIO_LABEL_GROUPS = [
  ['First step', [['emptyPurposes', 'No purposes message'], ['emptyLayer', 'Empty catalog message'], ['mulankLabel', 'Mulank heading'], ['bhagyankLabel', 'Bhagyank heading']]],
  ['Charm and thread', [['charmLabel', 'Charm heading'], ['charmsLoading', 'Charms loading message'], ['finishLabel', 'Finish heading'], ['threadLabel', 'Thread heading'], ['wristLabel', 'Wrist size heading']]],
  [
    'Bottom bar and ordering',
    [
      ['backLabel', 'Back button'],
      ['stepCounter', 'Step counter · {step} {total}'],
      ['beadsUnit', 'Word for "beads"'],
      ['nextChoose', 'Next button on Choose'],
      ['nextCrystals', 'Next button on Crystals'],
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
      ['clearBuild', 'Clear button'],
      ['reviewKicker', 'Review kicker'],
      ['rowBeadSize', 'Bead size label'],
      ['totalLabel', 'Total label'],
    ],
  ],
];


/** CMS step copy is matched to the studio flow by id, so steps never shift onto the wrong screen. */
function customizeSteps(stored) {
  return STUDIO_STEPS.map((entry) => {
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
        itemTitle: (s) => STUDIO_STEPS.find((f) => f.id === s.id)?.label || s.id,
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
    ...(kind === 'grievance'
      ? [
          group('Company details box', [
            row([text('detailsEyebrow', 'Eyebrow', { placeholder: 'How to reach us' }), text('detailsTitle', 'Title', { placeholder: 'Company details' })]),
            area('detailsNote', 'Note under the details', { rows: 2 }),
            text('writeLabel', 'Button label', { placeholder: 'Write to us' }),
          ]),
          note('Company name, phone, address and grievance officer come from the Footer section.'),
        ]
      : []),
  ],
}));

// Shared by every policy page.
LEGAL_SECTIONS.unshift({
  key: 'legalShared',
  label: 'All policy pages',
  group: 'Legal',
  hint: 'Side menu heading',
  preview: '/returns',
  base: 'pages.legal',
  fields: [text('navTitle', 'Side menu heading', { placeholder: 'Policies & care', hint: 'Also the eyebrow on a policy page that has none of its own.' })],
});
