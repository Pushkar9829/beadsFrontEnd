// Homepage and site-wide copy blocks of the SiteContent document.
// Homepage sections follow the v2 home layout order (see docs/home-nocturne-spec.md §1, §4).
import { cleanPoint, HeroHotspotField, LookPointsField } from './HotspotEditor';
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
      text('imageAlt', 'Image alt text', { hint: 'Describe the image for screen readers and search engines.' }),
      cta('primaryCta', 'Primary button'),
      cta('secondaryCta', 'Secondary button'),
      heroHotspot(),
      list(
        'slides',
        'Extra slides',
        [
          media('image', 'Image', { folder: 'banner' }),
          text('imageAlt', 'Image alt text'),
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
        max: 6,
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
      list(
        'items',
        'Houses',
        [
          row([select('slug', 'Collection', HOUSE_SLUGS), text('roman', 'Roman numeral')]),
          text('name', 'Name'),
          area('blurb', 'Blurb', { rows: 2 }),
          text('cta', 'Card link label'),
          media('image', 'House image', { folder: 'banner' }),
        ],
        { itemLabel: 'House', fixed: true, summary: (h) => h.name }
      ),
    ],
  },
  {
    key: 'studio',
    label: 'Studio tile',
    group: 'Homepage',
    hint: 'Customization tile next to the houses',
    preview: '/',
    base: '',
    paths: ['studio', 'ritual'],
    fields: [
      group(
        'Tile',
        [
          media('bannerImage', 'Image', { folder: 'studio' }),
          row([text('eyebrow', 'Eyebrow'), text('heading', 'Heading')]),
          area('copy', 'Copy'),
          row([text('cta', 'Button label'), text('to', 'Button link', { placeholder: '/customize' })]),
        ],
        'studio'
      ),
      group(
        'Ritual steps',
        [
          list('steps', 'Steps', [row([text('n', 'Number'), text('title', 'Title')]), area('body', 'Body', { rows: 2 })], {
            itemLabel: 'Step',
            hint: 'Step titles are shown as chips on the tile.',
            summary: (s) => s.title,
            newItem: (items) => ({ n: String(items.length + 1).padStart(2, '0'), title: '', body: '' }),
          }),
        ],
        'ritual'
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
    paths: ['featured', 'rails'],
    fields: [
      group('Heading', [eyebrowTitle(), area('body', 'Body'), linkPair()], 'featured'),
      note('The first tab shows the featured products. The other tabs fill themselves from sales, new arrivals and trends.'),
      ...[
        ['bestsellers', 'Best sellers tab'],
        ['newArrivals', 'New arrivals tab'],
        ['trending', 'Trending tab'],
      ].map(([k, title]) => group(title, [eyebrowTitle(), linkPair()], `rails.${k}`)),
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
      group('On the home page', [text('label', 'Badge label'), area('body', 'Body'), linkPair()]),
      group('On the sale page', [
        area('pageBody', 'Body'),
        text('emptyTitle', 'No sale running — title'),
        area('emptyBody', 'No sale running — body', { rows: 2 }),
        text('emptyProducts', 'Sale without products — line'),
      ]),
      note('The home block only shows while a flash sale is running.'),
    ],
  },
  {
    key: 'look',
    label: 'Shop the look',
    group: 'Homepage',
    hint: 'Styled photos with numbered product tags',
    preview: '/',
    base: 'look',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      list(
        'looks',
        'Looks',
        [
          media('image', 'Look image', { folder: 'banner', aspect: 'aspect-[4/5]' }),
          text('title', 'Title'),
          area('body', 'Body', { rows: 2 }),
          custom('items', 'Products on this look', LookPointsField, { max: 8 }),
        ],
        {
          itemLabel: 'Look',
          max: 6,
          hint: 'The block stays hidden until a look has at least one active product.',
          summary: (l) => l.title,
          newItem: { image: '', title: '', body: '', items: [] },
        }
      ),
    ],
    clean: (values) => ({
      ...values,
      look: {
        ...(values.look || {}),
        looks: (values.look?.looks || []).map((l) => ({ ...l, items: (l.items || []).map((p) => cleanPoint(p)) })),
      },
    }),
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
    group: 'Homepage',
    hint: 'Home block + purpose page',
    preview: '/customize/purpose',
    base: 'purpose',
    fields: [
      group('On the home page', [eyebrowTitle(), area('body', 'Body'), linkPair()]),
      group('On the purpose page', [row([text('pageEyebrow', 'Eyebrow'), text('pageTitle', 'Title')]), area('pageBody', 'Body')]),
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
      note('The four tiles are the first four Trust claims.', { to: '/admin/content?section=trust', linkLabel: 'Edit trust claims' }),
    ],
  },
  {
    key: 'trust',
    label: 'Trust claims',
    group: 'Homepage',
    hint: 'Craft tiles (first four) + about page',
    preview: '/',
    base: '',
    paths: ['trust', 'trustClaims'],
    fields: [
      group('Heading (about page)', [eyebrowTitle(), area('body', 'Body')], 'trust'),
      list('trustClaims', 'Claims', [icon('icon'), text('title', 'Title'), area('body', 'Body', { rows: 2 })], {
        itemLabel: 'Claim',
        hint: 'The first four appear as tiles in “The craft” on the home page.',
        summary: (c) => c.title,
        newItem: { icon: 'sparkles', title: '', body: '' },
      }),
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    group: 'Homepage',
    hint: 'Rating, customer notes and FAQ',
    preview: '/',
    base: '',
    paths: ['reviews', 'voices', 'testimonials', 'faq'],
    fields: [
      group('Heading', [eyebrowTitle(), toggle('showSummary', 'Show the average rating', { hint: 'Hidden automatically while there are no reviews.' })], 'reviews'),
      group('Customer notes', [eyebrowTitle(), area('body', 'Body')], 'voices'),
      list(
        'testimonials',
        'Notes',
        [
          area('quote', 'Quote'),
          row([text('name', 'Name'), text('place', 'City'), text('piece', 'Piece')]),
          media('media', 'Photo or video', { allowVideo: true, aspect: 'aspect-square' }),
        ],
        { itemLabel: 'Note', summary: (t) => t.name, newItem: { quote: '', name: '', place: '', piece: '', media: '' } }
      ),
      group('FAQ on the home page', [
        text('reviews.faqTitle', 'FAQ title'),
        row([text('faq.action', 'Link label'), text('faq.to', 'Link', { placeholder: '/faq' })]),
        note('The questions themselves are managed on the FAQs page.'),
      ]),
      group(
        'On the FAQ page',
        [row([text('pageEyebrow', 'Eyebrow'), text('pageTitle', 'Title')]), area('pageBody', 'Body'), area('emptyBody', 'When there are no questions', { rows: 2 })],
        'faq'
      ),
    ],
  },
  {
    key: 'journal',
    label: 'Journal',
    group: 'Homepage',
    hint: 'Home block + journal page',
    preview: '/journal',
    base: 'journal',
    fields: [
      group('On the home page', [eyebrowTitle(), linkPair()]),
      group('On the journal page', [row([text('pageEyebrow', 'Eyebrow'), text('pageTitle', 'Title')]), area('pageBody', 'Body'), area('emptyBody', 'When there are no posts', { rows: 2 })]),
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    group: 'Homepage',
    hint: 'Home block + footer',
    preview: '/',
    base: 'newsletter',
    fields: [eyebrowTitle(), text('compactTitle', 'Footer title')],
  },
  {
    key: 'finale',
    label: 'Closing banner',
    group: 'Homepage',
    hint: 'Last block (home, about, legal)',
    preview: '/',
    base: 'finale',
    fields: [
      media('image', 'Image', { folder: 'banner' }),
      row([text('kicker', 'Kicker'), text('title', 'Title')]),
      area('copy', 'Copy'),
      cta('primaryCta', 'Primary button'),
      cta('secondaryCta', 'Secondary button'),
    ],
  },
];

export const SITE_SECTIONS = [
  {
    key: 'brand',
    label: 'Header brand',
    group: 'Site-wide',
    hint: 'Name, tagline, logo, menu labels',
    preview: '/',
    base: 'brand',
    fields: [
      row([text('name', 'Header name'), text('tagline', 'Header tagline')]),
      media('logo', 'Logo', { folder: 'logo', hint: 'Optional. A logo set in Settings takes priority.', aspect: 'aspect-[3/1]' }),
      row([text('customizeLabel', 'Customization menu label'), text('collectionsLabel', 'Collections menu label'), text('shopAllLabel', 'Shop All menu label')]),
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
      group('Banner', [
        media('bannerImage', 'Banner image', { folder: 'banner' }),
        row([text('kicker', 'Kicker'), text('title', 'Title')]),
        area('copy', 'Copy'),
        text('cta', 'Button label'),
      ]),
      group('Brand', [
        media('logo', 'Footer logo', { folder: 'logo', aspect: 'aspect-[3/1]' }),
        row([text('brandName', 'Brand name'), text('tagline', 'Tagline')]),
        area('blurb', 'Blurb'),
        row([text('email', 'Email link', { placeholder: 'mailto:hello@…' }), text('instagram', 'Instagram URL')]),
        text('location', 'Location'),
      ]),
      group('Company & grievance', [
        row([text('legalEntity', 'Legal entity'), text('supportPhone', 'Support phone', { hint: 'Shown on Contact & grievance.' })]),
        text('address', 'Business address'),
        row([text('grievanceOfficer', 'Grievance officer'), text('grievanceEmail', 'Grievance email')]),
        text('copyright', 'Copyright line'),
        area('disclaimer', 'Disclaimer'),
      ]),
      group('Link columns', [
        row([text('shopHeading', 'Shop heading'), text('contactLabel', 'Contact button label')]),
        links('shopLinks', 'Shop links'),
        text('careHeading', 'Customer care heading'),
        links('careLinks', 'Customer care links'),
        text('legalHeading', 'Legal heading'),
        links('legalLinks', 'Legal links'),
      ]),
    ],
  },
  {
    key: 'contact',
    label: 'Contact drawer',
    group: 'Site-wide',
    hint: 'Contact form on every page',
    preview: '/',
    base: 'contact',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      text('submitLabel', 'Submit label'),
      group('After sending', [row([text('sentKicker', 'Kicker'), text('sentTitle', 'Title')]), area('sentBody', 'Body', { hint: '{name} and {email} are filled in automatically.' })]),
    ],
  },
];
