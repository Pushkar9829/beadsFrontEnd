// Storefront pages, studio copy and legal pages (all live under `about` / `pages.*`).
import { STUDIO_STEPS } from '../../../lib/studioFlow';
import { area, cta, emptyState, group, linkPair, list, listingEmpty, media, note, row, strings, text } from './schema';
import { getPath, setPath } from '../../ui';

const eyebrowTitle = () => row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]);
const authFields = [
  text('badge', 'Photo badge', { hint: 'Small badge at the top of the photo.' }),
  eyebrowTitle(),
  area('body', 'Body'),
  linkPair(),
  text('cardKicker', 'Card kicker'),
  row([text('submitLabel', 'Submit label'), text('submitBusy', 'Busy label')]),
  row([text('footer', 'Footer text'), text('footerLink', 'Footer link text')]),
  media('image', 'Side photo', { folder: 'banner', aspect: 'aspect-[4/5]', hint: 'Leave empty to use the built-in photo.' }),
];
const bagFields = [
  eyebrowTitle(),
  area('emptyBody', 'Body when empty'),
  area('filledBody', 'Body with items', { hint: '{count} and {pieces} are filled in automatically.' }),
  text('to', 'Continue shopping link', { placeholder: '/shop' }),
  emptyState('empty', 'Empty state', { kicker: false, secondary: false }),
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
      note('The headline and the card are under About layout. Headline and tagline here are used for search results.'),
      row([text('headline', 'Search title'), text('tagline', 'Search description')]),
      strings('intro', 'Paragraphs', { multiline: true, itemLabel: 'Paragraph' }),
      area('body', 'Extra body', { rows: 6 }),
    ],
  },
  {
    key: 'pageAbout',
    label: 'About layout',
    group: 'Pages',
    hint: 'About page headline and card',
    preview: '/about',
    base: 'pages.aboutPage',
    fields: [
      text('kicker', 'Eyebrow'),
      row([text('titleLead', 'Headline'), text('titleTail', 'Headline, gold italic part')]),
      group('Card', [text('cardTitle', 'Title'), area('cardBody', 'Text', { rows: 2 }), row([text('cardAction', 'Button label'), text('cardTo', 'Button link', { placeholder: '/customize' })])]),
    ],
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
      media('image', 'Banner image', { folder: 'banner', hint: 'Leave empty to use the built-in photo.' }),
      group('On a single collection page', [row([text('inEyebrow', 'Pieces eyebrow', { placeholder: 'In this collection' }), text('moreTitle', 'Other collections heading', { placeholder: 'More collections' })])]),
      listingEmpty(),
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
      row([text('heroAction', 'Hero button (all listing pages)', { placeholder: 'Custom Studio' }), text('heroTo', 'Hero button link', { placeholder: '/customize' })]),
      row([text('listEyebrow', 'Pieces eyebrow', { placeholder: 'Every house' }), text('listTitle', 'Pieces title', { placeholder: 'All pieces' })]),
      media('image', 'Banner image', { folder: 'banner', hint: 'Used for "all pieces". A house filter shows the image of that house (set under Homepage → Houses).' }),
      listingEmpty(),
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
      row([text('piecesEyebrow', 'Pieces eyebrow'), text('piecesTitle', 'Pieces title')]),
      area('piecesBody', 'Pieces body', { hint: '{count} and {pieces} are filled in automatically.' }),
      text('tilesEyebrow', 'Collections eyebrow', { placeholder: 'Inside the house' }),
      listingEmpty(),
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
      row([text('listTitle', 'Pieces title', { placeholder: 'The pieces' }), text('moreEyebrow', 'Related collections eyebrow', { placeholder: 'More from this house' })]),
      emptyState('missing', 'Category not found', { secondary: false }),
      listingEmpty('empty', 'Category without pieces'),
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
      text('relatedTitle', '"You may also like" title', { placeholder: 'You may also like' }),
      row([text('addLabel', 'Add-to-bag button', { placeholder: 'Add to bag' }), text('soldOutLabel', 'Sold-out button', { placeholder: 'Sold out' })]),
      text('benefitsLabel', 'Benefits heading', { placeholder: 'Sacred energy & benefits' }),
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
    fields: bagFields,
  },
  {
    key: 'pageWishlist',
    label: 'Wishlist',
    group: 'Pages',
    hint: 'Wishlist page',
    preview: '/wishlist',
    base: 'pages.wishlist',
    fields: [
      text('kicker', 'Eyebrow'),
      row([text('heading', 'Title'), text('headingTail', 'Title, gold italic part')]),
      area('intro', 'Text under the title', { rows: 2 }),
      group('When nothing is saved', [text('title', 'Title'), area('copy', 'Text', { rows: 2 }), cta('primaryCta', 'Button')], 'emptyState'),
    ],
  },
  {
    key: 'pageCheckout',
    label: 'Checkout',
    group: 'Pages',
    hint: 'Checkout page',
    preview: '/checkout',
    base: 'pages.checkout',
    fields: [
      row([text('emptyTitle', 'Empty title'), text('emptyBody', 'Empty body')]),
      row([text('submitLabel', 'Submit label'), text('submitBusy', 'Busy label')]),
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
      group('Member banner', [
        row([text('crumbLabel', 'Breadcrumb', { placeholder: 'Sanctuary Account' }), text('memberLabel', 'Badge', { placeholder: 'Member' })]),
        text('greeting', 'Greeting before the name', { placeholder: 'Namaste,' }),
        row([text('designAction', 'Button label', { placeholder: 'Design In Atelier' }), text('designTo', 'Button link', { placeholder: '/customize' })]),
        row([text('statOrders', 'Orders stat', { placeholder: 'Orders' }), text('statWishlist', 'Wishlist stat', { placeholder: 'Sacred Wishlist' }), text('statAddresses', 'Addresses stat', { placeholder: 'Saved Addresses' })]),
        row([text('tabOrders', 'Orders tab', { placeholder: 'Sacred Orders' }), text('tabProfile', 'Profile tab', { placeholder: 'Personal Dossier' })]),
      ]),
      group('Order placed', [text('placedKicker', 'Kicker'), area('placedBody', 'Body', { hint: '{number} is the order number.' })]),
      emptyState('empty', 'No orders yet', { kicker: false, secondary: false }),
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
    return { ...r, id: entry.id, title: r.title || entry.title || '', body: r.body || entry.body || '', hint: r.hint || '' };
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
    hint: 'Heading and hint of each studio step',
    preview: '/customize',
    base: 'pages.customize.steps',
    prepare: (values) => setPath(values, 'pages.customize.steps', customizeSteps(getPath(values, 'pages.customize.steps'))),
    fields: [
      list('', 'Steps', [text('title', 'Title'), area('body', 'Body', { rows: 2 }), text('hint', 'Hint', { hint: 'Shown in the bottom bar (and on Next) while the step is not complete. Empty: the built-in hint, which counts beads and names what is missing. Not used on Review, which is always complete.' })], {
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
            text('detailsTitle', 'Title', { placeholder: 'Company details' }),
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
