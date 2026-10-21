// Homepage and site-wide copy blocks of the SiteContent document.
// Homepage sections follow the v2 home layout order (see docs/home-nocturne-spec.md §1, §4).
import { cleanPoint, HeroHotspotField } from './HotspotEditor';
import { area, cta, custom, group, icon, linkPair, links, list, media, note, number, row, select, text, toggle } from './schema';

const HOUSE_SLUGS = ['crystals', 'rudraksha', 'gemstones'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

const eyebrowTitle = () => row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]);

const heroHotspot = () =>
  custom('hotspot', 'Product hotspot', HeroHotspotField, { hint: 'Places a product tag on the image. Without a product the tag is not shown.' });

const cleanHotspot = (h) => cleanPoint(h, { x: 31, y: 45 });

const FACT_TOKENS =
  'Tokens filled in live: {stones} natural stones, {purposes} purposes, {rating} average rating, {reviews} review count, {products} products, {minPrice} lowest price. ' +
  'An item whose token has no data yet (for example no reviews) is hidden automatically.';

export const HOME_SECTIONS = [
  {
    key: 'hero',
    label: 'Hero',
    group: 'Homepage',
    hint: 'Top of the home page + product hotspot',
    preview: '/',
    base: 'hero',
    fields: [
      row([text('eyebrow', 'Eyebrow'), text('brandName', 'Brand name')]),
      text('title', 'Headline', { hint: 'The last word is shown in gold italics.' }),
      area('subtitle', 'Subtitle'),
      media('image', 'Hero image', { folder: 'banner' }),
      text('imageAlt', 'Image alt text', { hint: 'The alt text of the hero image, for screen readers and search engines.' }),
      text('plaque', 'Specimen plaque', { hint: 'Small line in the hero dock. Empty: the hotspot product name, then the alt text.' }),
      cta('primaryCta', 'Primary button'),
      cta('secondaryCta', 'Secondary button'),
      heroHotspot(),
      list(
        'slides',
        'Extra slides',
        [
          media('image', 'Image', { folder: 'banner' }),
          text('imageAlt', 'Image alt text', { hint: 'The alt text of this slide image.' }),
          text('plaque', 'Specimen plaque'),
          row([text('eyebrow', 'Eyebrow'), text('title', 'Headline')]),
          area('subtitle', 'Subtitle', { rows: 2 }),
          cta('primaryCta', 'Primary button'),
          cta('secondaryCta', 'Secondary button'),
          heroHotspot(),
        ],
        {
          itemLabel: 'Slide',
          max: 6,
          hint: 'Optional. With extra slides the hero rotates; the first slide is the one above.',
          summary: (s) => s.title,
          newItem: {
            image: '',
            imageAlt: '',
            eyebrow: '',
            title: '',
            subtitle: '',
            primaryCta: { label: '', to: '' },
            secondaryCta: { label: '', to: '' },
            hotspot: { productSlug: '', x: 31, y: 45 },
          },
        }
      ),
    ],
    clean: (values) => {
      const hero = values.hero || {};
      return {
        ...values,
        hero: {
          ...hero,
          hotspot: cleanHotspot(hero.hotspot),
          slides: (hero.slides || []).map((s) => ({ ...s, hotspot: cleanHotspot(s.hotspot) })),
        },
      };
    },
  },
  {
    key: 'facts',
    label: 'Facts strip',
    group: 'Homepage',
    hint: 'Live numbers under the hero',
    preview: '/',
    base: 'facts',
    fields: [
      note(FACT_TOKENS),
      list('items', 'Facts', [row([text('value', 'Value', { placeholder: '{stones}' }), text('label', 'Label', { placeholder: 'Natural stones in our library' })])], {
        itemLabel: 'Fact',
        compact: true,
        max: 3,
        hint: 'Three lines, as in the design. Tokens like {stones} show live numbers.',
        newItem: { value: '', label: '' },
      }),
    ],
    clean: (values) => ({
      ...values,
      facts: {
        ...(values.facts || {}),
        items: (values.facts?.items || []).filter((f) => String(f.value || '').trim() || String(f.label || '').trim()),
      },
    }),
  },
  {
    key: 'houses',
    label: 'Houses',
    group: 'Homepage',
    hint: 'House tiles + header/footer house names',
    preview: '/',
    base: 'houses',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      text('exploreLabel', 'Plate link label', { placeholder: 'Explore House', hint: 'Followed by the roman numeral, e.g. “Explore House I”.' }),
      list(
        'items',
        'Houses',
        [
          row([select('slug', 'Collection', HOUSE_SLUGS), text('roman', 'Roman numeral')]),
          row([text('name', 'Name'), text('kicker', 'Kicker', { placeholder: 'Intention', hint: 'Shown after “House I ·”.' })]),
          area('blurb', 'Blurb', { rows: 2 }),
          media('image', 'House image', { folder: 'banner' }),
        ],
        { itemLabel: 'House', fixed: true, summary: (h) => h.name }
      ),
    ],
  },
  {
    key: 'studio',
    label: 'Studio tile & band',
    group: 'Homepage',
    hint: 'Customization tile next to the houses',
    preview: '/',
    base: '',
    paths: ['studio'],
    fields: [
      group(
        'Tile',
        [
          row([text('eyebrow', 'Eyebrow'), text('heading', 'Heading')]),
          area('copy', 'Copy'),
          row([text('cta', 'Button label'), text('to', 'Button link', { placeholder: '/customize' })]),
        ],
        'studio'
      ),
    ],
  },
  {
    key: 'collection',
    label: 'Collection',
    group: 'Homepage',
    hint: 'Carousel heading + tab titles',
    preview: '/',
    base: '',
    paths: ['featured'],
    fields: [
      group(
        'Heading and tabs',
        [
          eyebrowTitle(),
          area('body', 'Body'),
          linkPair(),
          note('Tabs: featured products, newest pieces, and pieces at or under a price.'),
          row([text('tabFeatured', 'Featured tab', { placeholder: 'Featured' }), text('tabNew', 'Newest tab', { placeholder: 'New In' })]),
          row([text('tabUnder', 'Price tab', { placeholder: 'Under {price}', hint: '{price} is the amount on the right.' }), number('underPrice', 'Price limit (₹)')]),
        ],
        'featured'
      ),
    ],
  },
  {
    key: 'flash',
    label: 'Flash sale copy',
    group: 'Homepage',
    hint: 'Home block + sale page',
    preview: '/sale',
    base: 'flash',
    fields: [
      group('On the home page', [row([text('label', 'Badge label'), text('title', 'Headline')]), area('body', 'Body'), linkPair(), text('addLabel', 'Add-to-bag button', { placeholder: 'Add' })]),
      group('On the sale page', [
        area('pageBody', 'Body'),
        text('emptyTitle', 'No sale running — title'),
        area('emptyBody', 'No sale running — body', { rows: 2 }),
        text('emptyProducts', 'Sale without products — line'),
        row([text('listEyebrow', 'Pieces eyebrow', { placeholder: 'On the tray' }), text('listTitle', 'Pieces title', { placeholder: 'Timed prices' })]),
        media('pageImage', 'Banner image', { folder: 'banner', hint: 'Leave empty to use the first sale piece (or a built-in photo when no sale runs).' }),
      ]),
      note('The home block only shows while a flash sale is running.'),
    ],
  },
  {
    key: 'finder',
    label: 'Stone finder',
    group: 'Homepage',
    hint: 'Find your stone by purpose or birth date',
    preview: '/',
    base: 'finder',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      row([number('purposeLimit', 'Purposes shown', { min: 1, max: 12, hint: 'How many purpose chips to offer.' }), text('cta', 'Button label')]),
      group('Labels', [
        row([text('askLabel', 'Step 1 label', { placeholder: 'What are you asking for?' }), text('orLabel', 'Divider', { placeholder: 'or by birth date' })]),
        row([text('stonesLabel', 'Step 2 label', { placeholder: 'Your stones' }), text('readyLabel', 'Ready-made line', { placeholder: 'Ready-made with these stones' })]),
        text('ctaNote', 'Note under the button'),
      ]),
      note('Suggested stones come from the customizer mappings (purpose → intention → beads, and Mulank → crystals).'),
    ],
    clean: (values) => {
      const limit = Number(values.finder?.purposeLimit);
      return { ...values, finder: { ...(values.finder || {}), purposeLimit: Number.isFinite(limit) && limit > 0 ? Math.min(12, Math.round(limit)) : 6 } };
    },
  },
  {
    key: 'purpose',
    label: 'Shop by purpose',
    group: 'Pages',
    hint: 'Heading of the purpose page',
    preview: '/customize/purpose',
    base: 'purpose',
    fields: [
      group('On the purpose page', [text('pageTitle', 'Title'), area('pageBody', 'Body')]),
      group('Fallback heading', [note('Used on the purpose page only when the title or body above is empty.'), text('title', 'Title'), area('body', 'Body')]),
    ],
  },
  {
    key: 'craft',
    label: 'The craft',
    group: 'Homepage',
    hint: 'How it is made + four trust tiles',
    preview: '/',
    base: 'craft',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      media('image', 'Image', { folder: 'banner' }),
      note('Optional image. Without one, the Rudraksha house image is used.'),
      text('plaque', 'Image plaque', { hint: 'Caption across the bottom of the image.' }),
      linkPair(),
      list('points', 'Attribute tiles', [text('title', 'Title'), area('body', 'Body', { rows: 2 })], {
        itemLabel: 'Tile',
        max: 4,
        summary: (p) => p.title,
        newItem: { title: '', body: '' },
      }),
    ],
  },
  {
    key: 'trust',
    label: 'Trust claims',
    group: 'Homepage',
    hint: 'Promises strip on the home page (four tiles)',
    preview: '/',
    base: '',
    paths: ['trustClaims'],
    fields: [
      list('trustClaims', 'Claims', [icon('icon'), text('title', 'Title'), area('body', 'Body', { rows: 2 })], {
        itemLabel: 'Claim',
        max: 4,
        hint: 'Shown as the Promises strip on the home page, which has exactly four tiles, so at most four claims. Empty: the built-in four.',
        summary: (c) => c.title,
        newItem: { icon: 'sparkles', title: '', body: '' },
      }),
    ],
    prepare: (values) => ({ ...values, trustClaims: (values.trustClaims || []).slice(0, 4) }),
    clean: (values) => ({ ...values, trustClaims: (values.trustClaims || []).slice(0, 4) }),
  },
  {
    key: 'reviews',
    label: 'Reviews',
    group: 'Homepage',
    hint: 'Rating, customer notes and the FAQ page heading',
    preview: '/',
    base: '',
    paths: ['reviews', 'voices', 'testimonials', 'faq'],
    fields: [
      group(
        'Heading',
        [
          eyebrowTitle(),
          toggle('showSummary', 'Show the average rating', { hint: 'Hidden automatically while there are no reviews.' }),
          text('verifiedLabel', 'Verified line under the rating'),
        ],
        'reviews'
      ),
      group('Customer notes', [eyebrowTitle(), area('body', 'Body')], 'voices'),
      list(
        'testimonials',
        'Notes',
        [
          area('quote', 'Quote'),
          row([text('name', 'Name'), text('place', 'City'), text('piece', 'Piece')]),
        ],
        { itemLabel: 'Note', summary: (t) => t.name, newItem: { quote: '', name: '', place: '', piece: '' } }
      ),
      group(
        'On the FAQ page',
        [
          text('kicker', 'Eyebrow'),
          row([text('heading', 'Title'), text('headingTail', 'Title, gold italic part')]),
          area('pageBody', 'Search description', { rows: 2 }),
          area('emptyBody', 'When there are no questions', { rows: 2 }),
        ],
        'faq'
      ),
    ],
  },
  {
    key: 'journal',
    label: 'Journal',
    group: 'Pages',
    hint: 'Journal page',
    preview: '/journal',
    base: 'journal',
    fields: [
      text('kicker', 'Eyebrow'),
      row([text('heading', 'Title'), text('headingTail', 'Title, gold italic part')]),
      area('intro', 'Text under the title', { rows: 2 }),
      row([text('pageTitle', 'Browser tab title'), area('pageBody', 'Search description', { rows: 2 })]),
      area('emptyBody', 'When there are no posts', { rows: 2 }),
    ],
  },
  {
    key: 'kundali',
    label: 'Kundali offer',
    group: 'Homepage',
    hint: 'Offer banner with the rosette seal and three steps',
    preview: '/',
    base: 'kundali',
    fields: [
      note('This banner advertises an offer. Switch it off under Homepage layout when the offer is not running.'),
      media('image', 'Banner image', { folder: 'banner', hint: 'Leave empty to use the built-in gift-box artwork.' }),
      text('eyebrow', 'Eyebrow'),
      row([text('titleLead', 'Title, first line'), text('titleTail', 'Title, gold italic line')]),
      row([text('bodyLead', 'Text before the highlight'), text('bodyHighlight', 'Highlighted words')]),
      row([text('bodyTail', 'Text before the amount'), text('threshold', 'Order amount', { placeholder: '₹2,000' })]),
      group('Seal', [row([text('sealTop', 'Top word'), text('sealName', 'Name')]), text('sealLine', 'Line above the amount')]),
      list(
        'steps',
        'Steps',
        [
          select('icon', 'Icon', [
            { value: 'bag', label: 'Shopping bag' },
            { value: 'cart', label: 'Cart' },
            { value: 'chart', label: 'Kundali chart' },
          ]),
          row([text('titleLead', 'Title, first line'), text('titleTail', 'Title, second line')]),
          area('body', 'Body', { rows: 2, hint: '{threshold} is replaced with the order amount.' }),
        ],
        { itemLabel: 'Step', max: 3, summary: (s) => `${s.titleLead || ''} ${s.titleTail || ''}`.trim(), newItem: { icon: 'bag', titleLead: '', titleTail: '', body: '' } }
      ),
      text('action', 'Button label', { placeholder: 'Avail the offer', hint: 'Opens the birth-details popup.' }),
      group('Birth-details popup', [
        text('modalEyebrow', 'Eyebrow'),
        row([text('modalTitleLead', 'Title'), text('modalTitleTail', 'Title, gold italic part')]),
        area('modalBody', 'Text', { rows: 3, hint: '{threshold} is replaced with the order amount.' }),
        text('modalHint', 'Note under the form'),
        text('modalAction', 'Submit button'),
      ]),
      group('After sending', [
        note('Requests arrive in Content → Contact inbox with the customer’s birth details.'),
        text('successEyebrow', 'Eyebrow'),
        row([text('successTitleLead', 'Title'), text('successTitleTail', 'Title, gold italic part')]),
        area('successBody', 'Text', { rows: 3, hint: '{name}, {place} and {threshold} are filled in.' }),
        text('successStatus', 'Status line'),
        row([text('successAction', 'Button label'), text('to', 'Button link', { placeholder: '/shop' })]),
      ]),
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    group: 'Homepage',
    hint: 'Sign-up block on the home page',
    preview: '/',
    base: 'newsletter',
    fields: [
      eyebrowTitle(),
      row([text('placeholder', 'Email placeholder', { placeholder: 'Your email address' }), text('action', 'Button label', { placeholder: 'Join →' })]),
      row([text('actionBusy', 'Button while sending', { placeholder: 'Joining…' }), text('success', 'Thank-you message', { placeholder: 'Thank you — you are on the list.' })]),
      area('body', 'Body', { rows: 2 }),
      text('note', 'Footnote'),
      media('image', 'Background image', { folder: 'banner', hint: 'Leave empty to use the built-in photo.' }),
    ],
  },
];

export const SITE_SECTIONS = [
  {
    key: 'brand',
    label: 'Header brand',
    group: 'Site-wide',
    hint: 'Name and menu labels',
    preview: '/',
    base: 'brand',
    fields: [
      text('name', 'Header name'),
      note('The logo (crystal emblem and gold wordmark) is part of the site design.'),
      group('Menu labels', [
        row([text('customizeLabel', 'Customization', { placeholder: 'Customization' }), text('collectionsLabel', 'Collections', { placeholder: 'Collections' })]),
        row([text('shopAllLabel', 'Shop All', { placeholder: 'Shop All' }), text('journalLabel', 'Journal', { placeholder: 'Journal' })]),
        row([text('studioMenuTitle', 'Customization dropdown heading', { placeholder: 'Begin a strand' }), text('allCollectionsLabel', '"All collections" link', { placeholder: 'All collections' })]),
        text('studioMenuAll', 'Customization dropdown link', { placeholder: 'Open the studio' }),
      ]),
      text('notice', 'Notice strip', { hint: 'Thin line above the header. Separate several messages with “·”. Hidden in the studio pages.' }),
      group('Account menu', [
        row([text('accountGuestTitle', 'Heading (signed out)'), text('accountMemberTitle', 'Heading (signed in)')]),
        row([text('accountGreeting', 'Greeting', { placeholder: 'Namaste,' }), text('accountOrders', 'Orders link')]),
        row([text('accountProfile', 'Account link'), text('accountWishlist', 'Wishlist link')]),
        row([text('accountSignIn', 'Sign in link'), text('accountRegister', 'Create account link')]),
        row([text('accountForgot', 'Forgot password link'), text('accountSignOut', 'Sign out link')]),
        text('accountRegisterCta', 'Bottom link (signed out)'),
      ]),
    ],
  },
  {
    key: 'footer',
    label: 'Footer',
    group: 'Site-wide',
    hint: 'Every page',
    preview: '/',
    base: 'footer',
    fields: [
      group('Brand', [
        note('The logo (crystal emblem and gold wordmark) is part of the site design.'),
        text('brandName', 'Brand name'),
        area('blurb', 'Blurb'),
        text('email', 'Email link', { placeholder: 'mailto:hello@…' }),
        text('payments', 'Payment badges', { placeholder: 'UPI, Cards, Netbanking', hint: 'Comma separated.' }),
        text('location', 'Location'),
      ]),
      group('Company & grievance', [
        row([text('legalEntity', 'Legal entity'), text('supportPhone', 'Support phone', { hint: 'Shown on Contact & grievance.' })]),
        text('address', 'Business address'),
        row([text('grievanceOfficer', 'Grievance officer'), text('grievanceEmail', 'Grievance email')]),
        text('copyright', 'Copyright line'),
        area('disclaimer', 'Disclaimer'),
      ]),
      list('trust', 'Trust strip', [icon('icon'), text('title', 'Title'), text('body', 'Line')], {
        itemLabel: 'Badge',
        max: 4,
        hint: 'Four badges across the top of the footer.',
        summary: (c) => c.title,
        newItem: { icon: 'sparkles', title: '', body: '' },
      }),
      group('Link columns', [
        text('shopHeading', 'Shop heading'),
        links('shopLinks', 'Shop links'),
        text('careHeading', 'Customer care heading'),
        links('careLinks', 'Customer care links'),
        links('legalLinks', 'Policy links (shown under the customer care links)'),
      ]),
    ],
  },
  {
    key: 'contact',
    label: 'Contact drawer',
    group: 'Site-wide',
    hint: 'Write-to-us form on the Contact & grievance page',
    preview: '/grievance',
    base: 'contact',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      text('submitLabel', 'Submit label'),
      group('After sending', [row([text('sentKicker', 'Kicker'), text('sentTitle', 'Title')]), area('sentBody', 'Body', { hint: '{name} and {email} are filled in automatically.' })]),
    ],
  },
];
