// Homepage and site-wide copy blocks of the SiteContent document.
import { area, cta, group, icon, linkPair, links, list, media, note, row, select, strings, text } from './schema';

const HOUSE_SLUGS = ['crystals', 'rudraksha', 'gemstones'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

const eyebrowTitle = () => row([text('eyebrow', 'Eyebrow'), text('title', 'Title')]);

export const HOME_SECTIONS = [
  {
    key: 'hero',
    label: 'Hero banner',
    group: 'Homepage',
    hint: 'Top of the home page',
    preview: '/',
    base: 'hero',
    fields: [
      row([text('eyebrow', 'Eyebrow'), text('brandName', 'Brand name')]),
      text('title', 'Headline'),
      area('subtitle', 'Subtitle'),
      media('image', 'Hero image', { folder: 'banner' }),
      text('imageAlt', 'Image alt text', { hint: 'Describe the image for screen readers and search engines.' }),
      cta('primaryCta', 'Primary button'),
      cta('secondaryCta', 'Secondary button'),
    ],
  },
  {
    key: 'marquee',
    label: 'Marquee strip',
    group: 'Homepage',
    hint: 'Scrolling words under the hero',
    preview: '/',
    base: 'marquee',
    fields: [strings('', 'Words', { itemLabel: 'Word', hint: 'Empty lines are dropped when you save.' })],
    clean: (values) => ({ ...values, marquee: (values.marquee || []).map((w) => String(w).trim()).filter(Boolean) }),
  },
  {
    key: 'houses',
    label: 'Three houses',
    group: 'Homepage',
    hint: 'Home cards + header/footer house names',
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
    label: 'Studio banner',
    group: 'Homepage',
    hint: 'Customization invite',
    preview: '/',
    base: 'studio',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      linkPair('action', 'to', 'Section '),
      group('Banner', [
        media('bannerImage', 'Banner image', { folder: 'studio' }),
        row([text('kicker', 'Kicker'), text('heading', 'Heading')]),
        area('copy', 'Copy'),
        text('cta', 'Button label'),
      ]),
    ],
  },
  {
    key: 'ritual',
    label: 'Ritual steps',
    group: 'Homepage',
    hint: 'How a strand is made',
    preview: '/',
    base: 'ritual',
    fields: [
      eyebrowTitle(),
      area('body', 'Body'),
      list('steps', 'Steps', [row([text('n', 'Number'), text('title', 'Title')]), area('body', 'Body', { rows: 2 })], {
        itemLabel: 'Step',
        summary: (s) => s.title,
        newItem: (items) => ({ n: String(items.length + 1).padStart(2, '0'), title: '', body: '' }),
      }),
    ],
  },
  {
    key: 'featured',
    label: 'Featured section',
    group: 'Homepage',
    hint: 'Heading above featured products',
    preview: '/',
    base: 'featured',
    fields: [eyebrowTitle(), area('body', 'Body'), linkPair(), note('The featured products themselves are chosen on the Featured page.')],
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
    key: 'rails',
    label: 'Product rails',
    group: 'Homepage',
    hint: 'Best sellers, new arrivals, trending',
    preview: '/',
    base: 'rails',
    fields: ['bestsellers:Best sellers', 'newArrivals:New arrivals', 'trending:Trending'].map((s) => {
      const [k, title] = s.split(':');
      return group(title, [eyebrowTitle(), linkPair()], k);
    }),
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    group: 'Homepage',
    hint: 'Voices from customers',
    preview: '/',
    base: '',
    paths: ['voices', 'testimonials'],
    fields: [
      group('Heading', [eyebrowTitle(), area('body', 'Body')], 'voices'),
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
    ],
  },
  {
    key: 'trust',
    label: 'Trust claims',
    group: 'Homepage',
    hint: 'Why Kuberstones (home + about)',
    preview: '/',
    base: '',
    paths: ['trust', 'trustClaims'],
    fields: [
      group('Heading', [eyebrowTitle(), area('body', 'Body')], 'trust'),
      list('trustClaims', 'Claims', [icon('icon'), text('title', 'Title'), area('body', 'Body', { rows: 2 })], {
        itemLabel: 'Claim',
        summary: (c) => c.title,
        newItem: { icon: 'sparkles', title: '', body: '' },
      }),
    ],
  },
  {
    key: 'faq',
    label: 'FAQ copy',
    group: 'Homepage',
    hint: 'Home block + FAQ page',
    preview: '/faq',
    base: 'faq',
    fields: [
      group('On the home page', [eyebrowTitle(), linkPair()]),
      group('On the FAQ page', [row([text('pageEyebrow', 'Eyebrow'), text('pageTitle', 'Title')]), area('pageBody', 'Body'), area('emptyBody', 'When there are no questions', { rows: 2 })]),
      note('The questions themselves are managed on the FAQs page.'),
    ],
  },
  {
    key: 'journal',
    label: 'Journal copy',
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
    label: 'Finale banner',
    group: 'Homepage',
    hint: 'Closing banner (home, about, legal)',
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
