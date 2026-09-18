import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import MediaField from '../../components/admin/MediaField';
import { CLAIM_ICON_OPTIONS } from '../../lib/claimIcons';
import { HOME_DEFAULTS, pickHome } from '../../lib/homeContent';
import { useContentStore } from '../../store/contentStore';
import { publishStorefront } from '../../lib/storefrontSync';

const HOUSE_SLUGS = ['crystals', 'rudraksha', 'gemstones'];

const SECTIONS = [
  { key: 'hero', label: 'Hero banner', hint: 'Home page' },
  { key: 'marquee', label: 'Marquee strip', hint: 'Home page' },
  { key: 'houses', label: 'Three houses', hint: 'Home + header/footer names' },
  { key: 'studio', label: 'Studio banner', hint: 'Home page' },
  { key: 'ritual', label: 'Ritual steps', hint: 'Home page' },
  { key: 'featured', label: 'Featured section', hint: 'Home page' },
  { key: 'brand', label: 'Header brand', hint: 'Name, tagline, logo, nav labels' },
  { key: 'purpose', label: 'Shop by purpose', hint: 'Home + purpose page' },
  { key: 'rails', label: 'Product rails', hint: 'Best sellers, new, trending' },
  { key: 'faq', label: 'FAQ copy', hint: 'Home + FAQ page' },
  { key: 'journal', label: 'Journal copy', hint: 'Home + journal page' },
  { key: 'flash', label: 'Flash sale copy', hint: 'Home + sale page' },
  { key: 'newsletter', label: 'Newsletter', hint: 'Home + footer' },
  { key: 'testimonials', label: 'Testimonials', hint: 'Home page' },
  { key: 'trust', label: 'Trust claims', hint: 'Home + About' },
  { key: 'finale', label: 'Finale banner', hint: 'Home, About, legal' },
  { key: 'footer', label: 'Footer', hint: 'Every page' },
  { key: 'contact', label: 'Contact drawer', hint: 'Every page' },
  { key: 'about', label: 'About copy', hint: 'About page body' },
  { key: 'pageAbout', label: 'About layout', hint: 'About page image and links' },
  { key: 'pageCollections', label: 'Collections index', hint: 'Collections listing page' },
  { key: 'pageShop', label: 'Shop All', hint: 'Shop page' },
  { key: 'pageFamily', label: 'House pages', hint: 'Crystals / Rudraksha / Gemstones' },
  { key: 'pageCategory', label: 'Category pages', hint: 'Collection empty states' },
  { key: 'pageProduct', label: 'Product missing', hint: 'When a piece is gone' },
  { key: 'pageCustomize', label: 'Customization steps', hint: 'Studio wizard copy' },
  { key: 'pageCart', label: 'Bag', hint: 'Cart page' },
  { key: 'pageWishlist', label: 'Wishlist', hint: 'Wishlist page' },
  { key: 'pageCheckout', label: 'Checkout', hint: 'Checkout page' },
  { key: 'pageLogin', label: 'Sign in', hint: 'Login page' },
  { key: 'pageRegister', label: 'Create account', hint: 'Register page' },
  { key: 'pageAccount', label: 'Account', hint: 'Account page' },
  { key: 'pageNotFound', label: '404', hint: 'Missing page' },
  { key: 'legalReturns', label: 'Returns', hint: 'Legal page', kind: 'returns' },
  { key: 'legalExchanges', label: 'Exchanges', hint: 'Legal page', kind: 'exchanges' },
  { key: 'legalRefunds', label: 'Refunds', hint: 'Legal page', kind: 'refunds' },
  { key: 'legalShipping', label: 'Shipping', hint: 'Legal page', kind: 'shipping' },
  { key: 'legalPrivacy', label: 'Privacy', hint: 'Legal page', kind: 'privacy' },
  { key: 'legalTerms', label: 'Terms', hint: 'Legal page', kind: 'terms' },
  { key: 'legalMaintenance', label: 'Maintenance', hint: 'Legal page', kind: 'maintenance' },
  { key: 'legalGrievance', label: 'Contact & grievance', hint: 'Legal page', kind: 'grievance' },
];

const LEGAL_CMS = {
  legalReturns: 'returns',
  legalExchanges: 'exchanges',
  legalRefunds: 'refunds',
  legalShipping: 'shipping',
  legalPrivacy: 'privacy',
  legalTerms: 'terms',
  legalMaintenance: 'maintenance',
  legalGrievance: 'grievance',
};

function Field({ label, value, onChange, textarea, rows = 3, placeholder }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label className={labelClass}>
      {label}
      <Tag
        rows={textarea ? rows : undefined}
        className={`${fieldClass} mt-1`}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CtaFields({ legend, value = {}, onChange }) {
  return (
    <div>
      {legend && <p className={labelClass}>{legend}</p>}
      <div className={`grid gap-3 sm:grid-cols-2 ${legend ? 'mt-2' : ''}`}>
        <Field label="Button label" value={value.label} onChange={(label) => onChange({ ...value, label })} />
        <Field label="Button link" value={value.to} onChange={(to) => onChange({ ...value, to })} placeholder="/customize" />
      </div>
    </div>
  );
}

function IconPicker({ value, onChange }) {
  return (
    <div>
      <p className={labelClass}>Icon</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CLAIM_ICON_OPTIONS.map(({ key, label, Icon }) => (
          <button
            type="button"
            key={key}
            title={label}
            onClick={() => onChange(key)}
            className={`rounded-lg border p-2 ${value === key ? 'border-gold bg-gold/15 text-gold' : 'border-gold/25 text-lilac hover:text-gold'}`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

function LinkListFields({ label, items = [], onChange }) {
  return (
    <div className="space-y-2 rounded-xl p-3 gold-border">
      <p className={labelClass}>{label}</p>
      {(items || []).map((item, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row">
          <input
            className={fieldClass}
            placeholder="Label"
            value={item.label || ''}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, label: e.target.value };
              onChange(next);
            }}
          />
          <input
            className={fieldClass}
            placeholder="/path"
            value={item.to || ''}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, to: e.target.value };
              onChange(next);
            }}
          />
          <button type="button" className="text-xs text-red-300" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => onChange([...(items || []), { label: '', to: '' }])}>
        Add link
      </Button>
    </div>
  );
}

function StringListFields({ label, items = [], onChange }) {
  return (
    <div className="space-y-2 rounded-xl p-3 gold-border">
      <p className={labelClass}>{label}</p>
      {(items || []).map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={fieldClass}
            value={item || ''}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button type="button" className="text-xs text-red-300" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => onChange([...(items || []), ''])}>Add line</Button>
    </div>
  );
}

function RailCopyFields({ label, value = {}, onChange }) {
  return (
    <div className="space-y-2 rounded-xl p-3 gold-border">
      <p className={labelClass}>{label}</p>
      <Field label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} />
      <Field label="Title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <Field label="Link label" value={value.action} onChange={(action) => onChange({ ...value, action })} />
      <Field label="Link" value={value.to} onChange={(to) => onChange({ ...value, to })} />
    </div>
  );
}

function EmptyFields({ value = {}, onChange }) {
  return (
    <div className="space-y-3 rounded-xl p-3 gold-border">
      <p className={labelClass}>Empty / missing state</p>
      <Field label="Kicker" value={value.kicker} onChange={(kicker) => onChange({ ...value, kicker })} />
      <Field label="Title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <Field label="Copy" textarea value={value.copy} onChange={(copy) => onChange({ ...value, copy })} />
      <CtaFields legend="Primary button" value={value.primaryCta} onChange={(primaryCta) => onChange({ ...value, primaryCta })} />
      <CtaFields legend="Secondary button" value={value.secondaryCta} onChange={(secondaryCta) => onChange({ ...value, secondaryCta })} />
    </div>
  );
}

function previewFor(content, key) {
  if (key === 'hero') return content.hero?.title || content.hero?.brandName || '—';
  if (key === 'marquee') return `${(content.marquee || []).length} words`;
  if (key === 'houses') return `${(content.houses?.items || []).length} houses`;
  if (key === 'studio') return content.studio?.heading || content.studio?.title || '—';
  if (key === 'ritual') return `${(content.ritual?.steps || []).length} steps`;
  if (key === 'featured') return content.featured?.title || '—';
  if (key === 'brand') return content.brand?.name || content.hero?.brandName || '—';
  if (key === 'purpose') return content.purpose?.title || '—';
  if (key === 'rails') return content.rails?.bestsellers?.title || '—';
  if (key === 'faq') return content.faq?.title || '—';
  if (key === 'journal') return content.journal?.title || '—';
  if (key === 'flash') return content.flash?.label || '—';
  if (key === 'newsletter') return content.newsletter?.title || '—';
  if (key === 'testimonials') return `${(content.testimonials || []).length} notes`;
  if (key === 'trust') return `${(content.trustClaims || []).length} claims`;
  if (key === 'finale') return content.finale?.title || '—';
  if (key === 'about') return content.about?.headline || '—';
  if (key === 'footer') return content.footer?.title || '—';
  if (key === 'contact') return content.contact?.title || '—';
  if (key === 'pageAbout') return content.pages?.aboutPage?.eyebrow || '—';
  if (key === 'pageCollections') return content.pages?.collections?.title || '—';
  if (key === 'pageShop') return content.pages?.shop?.title || '—';
  if (key === 'pageFamily') return content.pages?.family?.piecesTitle || '—';
  if (key === 'pageCategory') return content.pages?.category?.empty?.title || '—';
  if (key === 'pageProduct') return content.pages?.product?.missing?.title || '—';
  if (key === 'pageCustomize') return `${(content.pages?.customize?.steps || []).length} steps`;
  if (key === 'pageCart') return content.pages?.cart?.title || '—';
  if (key === 'pageWishlist') return content.pages?.wishlist?.title || '—';
  if (key === 'pageCheckout') return content.pages?.checkout?.title || '—';
  if (key === 'pageLogin') return content.pages?.login?.title || '—';
  if (key === 'pageRegister') return content.pages?.register?.title || '—';
  if (key === 'pageAccount') return content.pages?.account?.title || '—';
  if (key === 'pageNotFound') return content.pages?.notFound?.title || '—';
  if (LEGAL_CMS[key]) return content.pages?.legal?.[LEGAL_CMS[key]]?.title || '—';
  return '—';
}

export default function AdminContent() {
  const [content, setContent] = useState(null);
  const [section, setSection] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get('/admin/content').then(({ data }) => setContent(pickHome(data.content)));
  }

  useEffect(() => {
    load();
  }, []);

  if (!content) return null;

  function open(key) {
    setError('');
    setSection(key);
    const home = pickHome(content);
    if (key === 'hero') setDraft({ ...home.hero });
    if (key === 'marquee') setDraft([...(home.marquee || [])]);
    if (key === 'houses') setDraft({ ...home.houses, items: (home.houses.items || []).map((item) => ({ ...item })) });
    if (key === 'studio') setDraft({ ...home.studio });
    if (key === 'ritual') setDraft({ ...home.ritual, steps: (home.ritual.steps || []).map((step) => ({ ...step })) });
    if (key === 'featured') setDraft({ ...home.featured });
    if (key === 'brand') setDraft({ ...(home.brand || {}) });
    if (key === 'purpose') setDraft({ ...(home.purpose || {}) });
    if (key === 'rails') setDraft({
      bestsellers: { ...(home.rails?.bestsellers || {}) },
      newArrivals: { ...(home.rails?.newArrivals || {}) },
      trending: { ...(home.rails?.trending || {}) },
    });
    if (key === 'faq') setDraft({ ...(home.faq || {}) });
    if (key === 'journal') setDraft({ ...(home.journal || {}) });
    if (key === 'flash') setDraft({ ...(home.flash || {}) });
    if (key === 'newsletter') setDraft({ ...(home.newsletter || {}) });
    if (key === 'testimonials') {
      setDraft({
        ...home.voices,
        items: (home.testimonials?.length ? home.testimonials : HOME_DEFAULTS.testimonials).map((t) => ({ ...t })),
      });
    }
    if (key === 'trust') {
      setDraft({
        ...home.trust,
        claims: (home.trustClaims?.length ? home.trustClaims : HOME_DEFAULTS.trustClaims).map((c) => ({ ...c })),
      });
    }
    if (key === 'finale') setDraft({ ...home.finale });
    if (key === 'about') setDraft({
      ...home.about,
      intro: [...(home.about?.intro || [])],
      morePoints: [...(home.about?.morePoints || [])],
      promises: [...(home.about?.promises || [])],
      collections: (home.about?.collections || []).map((item) => ({ ...item })),
      different: (home.about?.different || []).map((item) => ({ ...item })),
      steps: (home.about?.steps || []).map((item) => ({ ...item })),
    });
    if (key === 'footer') setDraft({ ...home.footer });
    if (key === 'contact') setDraft({ ...home.contact });
    if (key === 'pageAbout') setDraft({ ...home.pages.aboutPage });
    if (key === 'pageCollections') setDraft({ ...home.pages.collections, empty: { ...home.pages.collections.empty } });
    if (key === 'pageShop') setDraft({ ...home.pages.shop, empty: { ...home.pages.shop.empty } });
    if (key === 'pageFamily') setDraft({ ...home.pages.family, empty: { ...home.pages.family.empty } });
    if (key === 'pageCategory') setDraft({ ...home.pages.category, empty: { ...home.pages.category.empty }, missing: { ...home.pages.category.missing } });
    if (key === 'pageProduct') setDraft({ missing: { ...home.pages.product.missing } });
    if (key === 'pageCustomize') setDraft({ steps: (home.pages.customize.steps || []).map((s) => ({ ...s })) });
    if (key === 'pageCart') setDraft({ ...home.pages.cart, empty: { ...home.pages.cart.empty } });
    if (key === 'pageWishlist') setDraft({ ...home.pages.wishlist, empty: { ...home.pages.wishlist.empty } });
    if (key === 'pageCheckout') setDraft({ ...home.pages.checkout });
    if (key === 'pageLogin') setDraft({ ...home.pages.login });
    if (key === 'pageRegister') setDraft({ ...home.pages.register });
    if (key === 'pageAccount') setDraft({ ...home.pages.account, empty: { ...home.pages.account.empty } });
    if (key === 'pageNotFound') setDraft({ ...home.pages.notFound });
    if (LEGAL_CMS[key]) {
      const page = home.pages.legal[LEGAL_CMS[key]] || { title: '', eyebrow: '', body: '', sections: [] };
      setDraft({ ...page, sections: (page.sections || []).map((s) => ({ ...s })) });
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const next = pickHome(content);
      if (section === 'hero') next.hero = draft;
      if (section === 'marquee') next.marquee = draft.filter((word) => String(word).trim());
      if (section === 'houses') next.houses = draft;
      if (section === 'studio') next.studio = draft;
      if (section === 'ritual') next.ritual = draft;
      if (section === 'featured') next.featured = draft;
      if (section === 'brand') next.brand = draft;
      if (section === 'purpose') next.purpose = draft;
      if (section === 'rails') next.rails = draft;
      if (section === 'faq') next.faq = draft;
      if (section === 'journal') next.journal = draft;
      if (section === 'flash') next.flash = draft;
      if (section === 'newsletter') next.newsletter = draft;
      if (section === 'testimonials') {
        next.voices = { eyebrow: draft.eyebrow, title: draft.title, body: draft.body };
        next.testimonials = draft.items;
      }
      if (section === 'trust') {
        next.trust = { eyebrow: draft.eyebrow, title: draft.title, body: draft.body };
        next.trustClaims = draft.claims;
      }
      if (section === 'finale') next.finale = draft;
      if (section === 'about') next.about = draft;
      if (section === 'footer') next.footer = draft;
      if (section === 'contact') next.contact = draft;
      if (section.startsWith('page') || section.startsWith('legal')) {
        next.pages = { ...next.pages };
        if (section === 'pageAbout') next.pages.aboutPage = draft;
        if (section === 'pageCollections') next.pages.collections = draft;
        if (section === 'pageShop') next.pages.shop = draft;
        if (section === 'pageFamily') next.pages.family = draft;
        if (section === 'pageCategory') next.pages.category = draft;
        if (section === 'pageProduct') next.pages.product = draft;
        if (section === 'pageCustomize') next.pages.customize = draft;
        if (section === 'pageCart') next.pages.cart = draft;
        if (section === 'pageWishlist') next.pages.wishlist = draft;
        if (section === 'pageCheckout') next.pages.checkout = draft;
        if (section === 'pageLogin') next.pages.login = draft;
        if (section === 'pageRegister') next.pages.register = draft;
        if (section === 'pageAccount') next.pages.account = draft;
        if (section === 'pageNotFound') next.pages.notFound = draft;
        if (LEGAL_CMS[section]) {
          next.pages.legal = { ...next.pages.legal, [LEGAL_CMS[section]]: draft };
        }
      }
      const { data } = await api.put('/admin/content', next);
      setContent(pickHome(data.content));
      useContentStore.getState().load(true);
      publishStorefront();
      setSection(null);
    } catch (err) {
      setError(err.message || 'Could not save this section.');
    } finally {
      setSaving(false);
    }
  }

  const rows = SECTIONS.map((s) => ({
    ...s,
    preview: previewFor(content, s.key),
  }));

  return (
    <div>
      <AdminHeader
        title="Site CMS"
        subtitle="Home, every storefront page, footer, and legal copy. Save a section to publish it."
      />
      <AdminTable
        rows={rows}
        rowKey={(r) => r.key}
        columns={[
          { key: 'label', label: 'Section', render: (r) => (
            <div>
              <div className="text-ivory">{r.label}</div>
              <div className="text-xs text-lilac">{r.hint}</div>
            </div>
          ) },
          { key: 'preview', label: 'Live preview' },
          { key: 'actions', label: 'Actions', align: 'right', render: (r) => <RowActions onEdit={() => open(r.key)} /> },
        ]}
      />
      <AdminDrawer
        open={!!section}
        wide
        title={SECTIONS.find((s) => s.key === section)?.label || 'Edit'}
        onClose={() => setSection(null)}
      >
        <form onSubmit={save} className="space-y-4">
          {section === 'hero' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Brand name" value={draft.brandName} onChange={(brandName) => setDraft({ ...draft, brandName })} />
              <Field label="Headline" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Subtitle" textarea value={draft.subtitle} onChange={(subtitle) => setDraft({ ...draft, subtitle })} />
              <MediaField label="Hero image" folder="banner" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
              <Field label="Image alt text" value={draft.imageAlt} onChange={(imageAlt) => setDraft({ ...draft, imageAlt })} />
              <CtaFields legend="Primary button" value={draft.primaryCta} onChange={(primaryCta) => setDraft({ ...draft, primaryCta })} />
              <CtaFields legend="Secondary button" value={draft.secondaryCta} onChange={(secondaryCta) => setDraft({ ...draft, secondaryCta })} />
            </>
          )}

          {section === 'marquee' && Array.isArray(draft) && (
            <>
              {draft.map((word, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={fieldClass}
                    value={word}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = e.target.value;
                      setDraft(next);
                    }}
                  />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}>
                    Remove
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft([...draft, ''])}>Add word</Button>
            </>
          )}

          {section === 'houses' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              {(draft.items || []).map((item, i) => (
                <div key={i} className="space-y-3 rounded-xl p-3 gold-border">
                  <p className="text-[10px] uppercase tracking-widest text-gold">House {i + 1}</p>
                  <label className={labelClass}>
                    Collection
                    <select
                      className={`${fieldClass} mt-1`}
                      value={item.slug}
                      onChange={(e) => {
                        const items = [...draft.items];
                        items[i] = { ...item, slug: e.target.value };
                        setDraft({ ...draft, items });
                      }}
                    >
                      {HOUSE_SLUGS.map((slug) => (
                        <option key={slug} value={slug}>{slug}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="Roman numeral" value={item.roman} onChange={(roman) => {
                    const items = [...draft.items];
                    items[i] = { ...item, roman };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="Name" value={item.name} onChange={(name) => {
                    const items = [...draft.items];
                    items[i] = { ...item, name };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="Blurb" textarea rows={2} value={item.blurb} onChange={(blurb) => {
                    const items = [...draft.items];
                    items[i] = { ...item, blurb };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="Card link label" value={item.cta} onChange={(cta) => {
                    const items = [...draft.items];
                    items[i] = { ...item, cta };
                    setDraft({ ...draft, items });
                  }} />
                  <MediaField label="House image" folder="banner" value={item.image} onChange={(image) => {
                    const items = [...draft.items];
                    items[i] = { ...item, image };
                    setDraft({ ...draft, items });
                  }} />
                </div>
              ))}
            </>
          )}

          {section === 'studio' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Section link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Section link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <MediaField label="Studio banner" folder="studio" value={draft.bannerImage} onChange={(bannerImage) => setDraft({ ...draft, bannerImage })} />
              <Field label="Banner kicker" value={draft.kicker} onChange={(kicker) => setDraft({ ...draft, kicker })} />
              <Field label="Banner heading" value={draft.heading} onChange={(heading) => setDraft({ ...draft, heading })} />
              <Field label="Banner copy" textarea value={draft.copy} onChange={(copy) => setDraft({ ...draft, copy })} />
              <Field label="Banner CTA" value={draft.cta} onChange={(cta) => setDraft({ ...draft, cta })} />
            </>
          )}

          {section === 'ritual' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              {(draft.steps || []).map((step, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <Field label="Number" value={step.n} onChange={(n) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, n };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Title" value={step.title} onChange={(title) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, title };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Body" textarea rows={2} value={step.body} onChange={(body) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, body };
                    setDraft({ ...draft, steps });
                  }} />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, idx) => idx !== i) })}>
                    Remove step
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, steps: [...(draft.steps || []), { n: String((draft.steps || []).length + 1).padStart(2, '0'), title: '', body: '' }] })}>
                Add step
              </Button>
            </>
          )}

          {section === 'featured' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <p className="text-xs text-lilac">Featured products themselves are chosen on the Products screen (star as featured).</p>
            </>
          )}

          {section === 'brand' && draft && (
            <>
              <Field label="Header name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
              <Field label="Header tagline" value={draft.tagline} onChange={(tagline) => setDraft({ ...draft, tagline })} />
              <MediaField label="Logo (optional, Settings logo wins if set)" folder="logo" value={draft.logo} onChange={(logo) => setDraft({ ...draft, logo })} />
              <Field label="Customization nav label" value={draft.customizeLabel} onChange={(customizeLabel) => setDraft({ ...draft, customizeLabel })} />
              <Field label="Collections nav label" value={draft.collectionsLabel} onChange={(collectionsLabel) => setDraft({ ...draft, collectionsLabel })} />
              <Field label="Shop All nav label" value={draft.shopAllLabel} onChange={(shopAllLabel) => setDraft({ ...draft, shopAllLabel })} />
            </>
          )}

          {section === 'purpose' && draft && (
            <>
              <Field label="Home eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Home title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Home body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Home link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Home link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Page eyebrow" value={draft.pageEyebrow} onChange={(pageEyebrow) => setDraft({ ...draft, pageEyebrow })} />
              <Field label="Page title" value={draft.pageTitle} onChange={(pageTitle) => setDraft({ ...draft, pageTitle })} />
              <Field label="Page body" textarea value={draft.pageBody} onChange={(pageBody) => setDraft({ ...draft, pageBody })} />
            </>
          )}

          {section === 'rails' && draft && (
            <>
              <RailCopyFields label="Best sellers" value={draft.bestsellers} onChange={(bestsellers) => setDraft({ ...draft, bestsellers })} />
              <RailCopyFields label="New arrivals" value={draft.newArrivals} onChange={(newArrivals) => setDraft({ ...draft, newArrivals })} />
              <RailCopyFields label="Trending" value={draft.trending} onChange={(trending) => setDraft({ ...draft, trending })} />
            </>
          )}

          {section === 'faq' && draft && (
            <>
              <Field label="Home eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Home title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Home link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Home link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Page eyebrow" value={draft.pageEyebrow} onChange={(pageEyebrow) => setDraft({ ...draft, pageEyebrow })} />
              <Field label="Page title" value={draft.pageTitle} onChange={(pageTitle) => setDraft({ ...draft, pageTitle })} />
              <Field label="Page body" textarea value={draft.pageBody} onChange={(pageBody) => setDraft({ ...draft, pageBody })} />
              <Field label="Empty body" textarea value={draft.emptyBody} onChange={(emptyBody) => setDraft({ ...draft, emptyBody })} />
            </>
          )}

          {section === 'journal' && draft && (
            <>
              <Field label="Home eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Home title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Home link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Home link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Page eyebrow" value={draft.pageEyebrow} onChange={(pageEyebrow) => setDraft({ ...draft, pageEyebrow })} />
              <Field label="Page title" value={draft.pageTitle} onChange={(pageTitle) => setDraft({ ...draft, pageTitle })} />
              <Field label="Page body" textarea value={draft.pageBody} onChange={(pageBody) => setDraft({ ...draft, pageBody })} />
              <Field label="Empty body" textarea value={draft.emptyBody} onChange={(emptyBody) => setDraft({ ...draft, emptyBody })} />
            </>
          )}

          {section === 'flash' && draft && (
            <>
              <Field label="Badge label" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} />
              <Field label="Home body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Home link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Home link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Sale page body" textarea value={draft.pageBody} onChange={(pageBody) => setDraft({ ...draft, pageBody })} />
              <Field label="Empty sale title" value={draft.emptyTitle} onChange={(emptyTitle) => setDraft({ ...draft, emptyTitle })} />
              <Field label="Empty sale body" textarea value={draft.emptyBody} onChange={(emptyBody) => setDraft({ ...draft, emptyBody })} />
              <Field label="Empty products line" value={draft.emptyProducts} onChange={(emptyProducts) => setDraft({ ...draft, emptyProducts })} />
            </>
          )}

          {section === 'newsletter' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Footer compact title" value={draft.compactTitle} onChange={(compactTitle) => setDraft({ ...draft, compactTitle })} />
            </>
          )}

          {section === 'testimonials' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              {(draft.items || []).map((t, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <Field label="Quote" textarea value={t.quote} onChange={(quote) => {
                    const items = [...draft.items];
                    items[i] = { ...t, quote };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="Name" value={t.name} onChange={(name) => {
                    const items = [...draft.items];
                    items[i] = { ...t, name };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="City" value={t.place} onChange={(place) => {
                    const items = [...draft.items];
                    items[i] = { ...t, place };
                    setDraft({ ...draft, items });
                  }} />
                  <Field label="Piece" value={t.piece} onChange={(piece) => {
                    const items = [...draft.items];
                    items[i] = { ...t, piece };
                    setDraft({ ...draft, items });
                  }} />
                  <MediaField
                    label="Photo or video"
                    folder="other"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    value={t.media}
                    onChange={(media) => {
                      const items = [...draft.items];
                      items[i] = { ...t, media };
                      setDraft({ ...draft, items });
                    }}
                  />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) })}>
                    Remove note
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, items: [...(draft.items || []), { quote: '', name: '', place: '', piece: '', media: '' }] })}>
                Add note
              </Button>
            </>
          )}

          {section === 'trust' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              {(draft.claims || []).map((c, i) => (
                <div key={i} className="space-y-3 rounded-xl p-3 gold-border">
                  <IconPicker
                    value={c.icon}
                    onChange={(icon) => {
                      const claims = [...draft.claims];
                      claims[i] = { ...c, icon };
                      setDraft({ ...draft, claims });
                    }}
                  />
                  <Field label="Title" value={c.title} onChange={(title) => {
                    const claims = [...draft.claims];
                    claims[i] = { ...c, title };
                    setDraft({ ...draft, claims });
                  }} />
                  <Field label="Body" textarea rows={2} value={c.body} onChange={(body) => {
                    const claims = [...draft.claims];
                    claims[i] = { ...c, body };
                    setDraft({ ...draft, claims });
                  }} />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, claims: draft.claims.filter((_, idx) => idx !== i) })}>
                    Remove claim
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, claims: [...(draft.claims || []), { icon: 'sparkles', title: '', body: '' }] })}>
                Add claim
              </Button>
            </>
          )}

          {section === 'finale' && draft && (
            <>
              <MediaField label="Finale image" folder="banner" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
              <Field label="Kicker" value={draft.kicker} onChange={(kicker) => setDraft({ ...draft, kicker })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Copy" textarea value={draft.copy} onChange={(copy) => setDraft({ ...draft, copy })} />
              <CtaFields legend="Primary button" value={draft.primaryCta} onChange={(primaryCta) => setDraft({ ...draft, primaryCta })} />
              <CtaFields legend="Secondary button" value={draft.secondaryCta} onChange={(secondaryCta) => setDraft({ ...draft, secondaryCta })} />
            </>
          )}

          {section === 'about' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Headline" value={draft.headline} onChange={(headline) => setDraft({ ...draft, headline })} />
              <Field label="Tagline" value={draft.tagline} onChange={(tagline) => setDraft({ ...draft, tagline })} />
              <StringListFields label="Intro paragraphs" items={draft.intro || []} onChange={(intro) => setDraft({ ...draft, intro })} />
              <Field label="Extra body" textarea rows={6} value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="More title" value={draft.moreTitle} onChange={(moreTitle) => setDraft({ ...draft, moreTitle })} />
              <Field label="More body" textarea value={draft.moreBody} onChange={(moreBody) => setDraft({ ...draft, moreBody })} />
              <StringListFields label="More points" items={draft.morePoints || []} onChange={(morePoints) => setDraft({ ...draft, morePoints })} />
              <Field label="More close" textarea value={draft.moreClose} onChange={(moreClose) => setDraft({ ...draft, moreClose })} />
              <Field label="Collections title" value={draft.collectionsTitle} onChange={(collectionsTitle) => setDraft({ ...draft, collectionsTitle })} />
              {(draft.collections || []).map((item, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <p className="text-[10px] uppercase tracking-widest text-gold">Collection {i + 1}</p>
                  <Field label="Name" value={item.name} onChange={(name) => {
                    const collections = [...draft.collections];
                    collections[i] = { ...item, name };
                    setDraft({ ...draft, collections });
                  }} />
                  <Field label="Link" value={item.to} onChange={(to) => {
                    const collections = [...draft.collections];
                    collections[i] = { ...item, to };
                    setDraft({ ...draft, collections });
                  }} />
                  <Field label="Body" textarea rows={2} value={item.body} onChange={(body) => {
                    const collections = [...draft.collections];
                    collections[i] = { ...item, body };
                    setDraft({ ...draft, collections });
                  }} />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, collections: draft.collections.filter((_, idx) => idx !== i) })}>Remove</button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, collections: [...(draft.collections || []), { name: '', to: '', body: '' }] })}>Add collection</Button>
              <Field label="Different title" value={draft.differentTitle} onChange={(differentTitle) => setDraft({ ...draft, differentTitle })} />
              {(draft.different || []).map((item, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <Field label="Title" value={item.title} onChange={(title) => {
                    const different = [...draft.different];
                    different[i] = { ...item, title };
                    setDraft({ ...draft, different });
                  }} />
                  <Field label="Body" textarea rows={2} value={item.body} onChange={(body) => {
                    const different = [...draft.different];
                    different[i] = { ...item, body };
                    setDraft({ ...draft, different });
                  }} />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft({ ...draft, different: draft.different.filter((_, idx) => idx !== i) })}>Remove</button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, different: [...(draft.different || []), { title: '', body: '' }] })}>Add difference</Button>
              <Field label="Approach eyebrow" value={draft.approachTitle} onChange={(approachTitle) => setDraft({ ...draft, approachTitle })} />
              <Field label="Approach title" value={draft.approachKicker} onChange={(approachKicker) => setDraft({ ...draft, approachKicker })} />
              <Field label="Approach body" textarea value={draft.approachBody} onChange={(approachBody) => setDraft({ ...draft, approachBody })} />
              <Field label="Approach note" textarea value={draft.approachNote} onChange={(approachNote) => setDraft({ ...draft, approachNote })} />
              {(draft.steps || []).map((step, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <Field label="Number" value={step.n} onChange={(n) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, n };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Title" value={step.title} onChange={(title) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, title };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Body" textarea rows={2} value={step.body} onChange={(body) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, body };
                    setDraft({ ...draft, steps });
                  }} />
                </div>
              ))}
              <Field label="Vision title" value={draft.visionTitle} onChange={(visionTitle) => setDraft({ ...draft, visionTitle })} />
              <Field label="Vision" textarea value={draft.vision} onChange={(vision) => setDraft({ ...draft, vision })} />
              <Field label="Promise title" value={draft.promiseTitle} onChange={(promiseTitle) => setDraft({ ...draft, promiseTitle })} />
              <StringListFields label="Promises" items={draft.promises || []} onChange={(promises) => setDraft({ ...draft, promises })} />
              <Field label="Close line" value={draft.closeLine} onChange={(closeLine) => setDraft({ ...draft, closeLine })} />
              <Field label="Close entity" value={draft.closeEntity} onChange={(closeEntity) => setDraft({ ...draft, closeEntity })} />
            </>
          )}

          {section === 'footer' && draft && (
            <>
              <MediaField label="Banner image" folder="banner" value={draft.bannerImage} onChange={(bannerImage) => setDraft({ ...draft, bannerImage })} />
              <MediaField label="Footer logo" folder="logo" value={draft.logo} onChange={(logo) => setDraft({ ...draft, logo })} />
              <Field label="Kicker" value={draft.kicker} onChange={(kicker) => setDraft({ ...draft, kicker })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Copy" textarea value={draft.copy} onChange={(copy) => setDraft({ ...draft, copy })} />
              <Field label="Button label" value={draft.cta} onChange={(cta) => setDraft({ ...draft, cta })} />
              <Field label="Brand name" value={draft.brandName} onChange={(brandName) => setDraft({ ...draft, brandName })} />
              <Field label="Blurb" textarea value={draft.blurb} onChange={(blurb) => setDraft({ ...draft, blurb })} />
              <Field label="Tagline" value={draft.tagline} onChange={(tagline) => setDraft({ ...draft, tagline })} />
              <Field label="Email link" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
              <Field label="Instagram URL" value={draft.instagram} onChange={(instagram) => setDraft({ ...draft, instagram })} />
              <Field label="Location" value={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
              <Field label="Legal entity" value={draft.legalEntity} onChange={(legalEntity) => setDraft({ ...draft, legalEntity })} />
              <Field label="Support phone" value={draft.supportPhone} onChange={(supportPhone) => setDraft({ ...draft, supportPhone })} placeholder="Shown on Contact & Grievance" />
              <Field label="Business address" value={draft.address} onChange={(address) => setDraft({ ...draft, address })} />
              <Field label="Grievance officer" value={draft.grievanceOfficer} onChange={(grievanceOfficer) => setDraft({ ...draft, grievanceOfficer })} />
              <Field label="Grievance email" value={draft.grievanceEmail} onChange={(grievanceEmail) => setDraft({ ...draft, grievanceEmail })} />
              <Field label="Copyright line" value={draft.copyright} onChange={(copyright) => setDraft({ ...draft, copyright })} />
              <Field label="Disclaimer" textarea value={draft.disclaimer} onChange={(disclaimer) => setDraft({ ...draft, disclaimer })} />
              <Field label="Shop heading" value={draft.shopHeading} onChange={(shopHeading) => setDraft({ ...draft, shopHeading })} />
              <LinkListFields label="Shop links" items={draft.shopLinks || []} onChange={(shopLinks) => setDraft({ ...draft, shopLinks })} />
              <Field label="Contact button label" value={draft.contactLabel} onChange={(contactLabel) => setDraft({ ...draft, contactLabel })} />
              <Field label="Care heading" value={draft.careHeading} onChange={(careHeading) => setDraft({ ...draft, careHeading })} />
              <LinkListFields label="Customer care links" items={draft.careLinks || []} onChange={(careLinks) => setDraft({ ...draft, careLinks })} />
              <Field label="Legal heading" value={draft.legalHeading} onChange={(legalHeading) => setDraft({ ...draft, legalHeading })} />
              <LinkListFields label="Legal links" items={draft.legalLinks || []} onChange={(legalLinks) => setDraft({ ...draft, legalLinks })} />
            </>
          )}

          {section === 'contact' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Submit label" value={draft.submitLabel} onChange={(submitLabel) => setDraft({ ...draft, submitLabel })} />
              <Field label="Sent kicker" value={draft.sentKicker} onChange={(sentKicker) => setDraft({ ...draft, sentKicker })} />
              <Field label="Sent title" value={draft.sentTitle} onChange={(sentTitle) => setDraft({ ...draft, sentTitle })} />
              <Field label="Sent body ({name}, {email})" textarea value={draft.sentBody} onChange={(sentBody) => setDraft({ ...draft, sentBody })} />
            </>
          )}

          {section === 'pageAbout' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <MediaField label="Portrait image" folder="other" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
            </>
          )}

          {section === 'pageCollections' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Card action" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageShop' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Filtered body ({house})" textarea value={draft.familyBody} onChange={(familyBody) => setDraft({ ...draft, familyBody })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageFamily' && draft && (
            <>
              <Field label="Shop link label" value={draft.shopAction} onChange={(shopAction) => setDraft({ ...draft, shopAction })} />
              <Field label="Shop link" value={draft.shopTo} onChange={(shopTo) => setDraft({ ...draft, shopTo })} />
              <Field label="Pieces eyebrow" value={draft.piecesEyebrow} onChange={(piecesEyebrow) => setDraft({ ...draft, piecesEyebrow })} />
              <Field label="Pieces title" value={draft.piecesTitle} onChange={(piecesTitle) => setDraft({ ...draft, piecesTitle })} />
              <Field label="Pieces body ({count}, {pieces})" textarea value={draft.piecesBody} onChange={(piecesBody) => setDraft({ ...draft, piecesBody })} />
              <Field label="Pieces link label" value={draft.piecesAction} onChange={(piecesAction) => setDraft({ ...draft, piecesAction })} />
              <Field label="Pieces link" value={draft.piecesTo} onChange={(piecesTo) => setDraft({ ...draft, piecesTo })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageCategory' && draft && (
            <>
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <EmptyFields value={draft.missing} onChange={(missing) => setDraft({ ...draft, missing })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageProduct' && draft && (
            <EmptyFields value={draft.missing} onChange={(missing) => setDraft({ ...draft, missing })} />
          )}

          {section === 'pageCustomize' && draft && (
            <>
              {(draft.steps || []).map((step, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <p className="text-[10px] uppercase tracking-widest text-gold">Step {i + 1}</p>
                  <Field label="Eyebrow" value={step.eyebrow} onChange={(eyebrow) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, eyebrow };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Title" value={step.title} onChange={(title) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, title };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Body" textarea value={step.body} onChange={(body) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, body };
                    setDraft({ ...draft, steps });
                  }} />
                  <Field label="Hint" value={step.hint} onChange={(hint) => {
                    const steps = [...draft.steps];
                    steps[i] = { ...step, hint };
                    setDraft({ ...draft, steps });
                  }} />
                </div>
              ))}
            </>
          )}

          {(section === 'pageCart' || section === 'pageWishlist') && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Empty body" textarea value={draft.emptyBody} onChange={(emptyBody) => setDraft({ ...draft, emptyBody })} />
              <Field label="Filled body" textarea value={draft.filledBody} onChange={(filledBody) => setDraft({ ...draft, filledBody })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageCheckout' && draft && (
            <>
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Empty title" value={draft.emptyTitle} onChange={(emptyTitle) => setDraft({ ...draft, emptyTitle })} />
              <Field label="Empty body" value={draft.emptyBody} onChange={(emptyBody) => setDraft({ ...draft, emptyBody })} />
              <Field label="Submit label" value={draft.submitLabel} onChange={(submitLabel) => setDraft({ ...draft, submitLabel })} />
              <Field label="Busy label" value={draft.submitBusy} onChange={(submitBusy) => setDraft({ ...draft, submitBusy })} />
              <Field label="Summary title" value={draft.summaryTitle} onChange={(summaryTitle) => setDraft({ ...draft, summaryTitle })} />
            </>
          )}

          {(section === 'pageLogin' || section === 'pageRegister') && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Card kicker" value={draft.cardKicker} onChange={(cardKicker) => setDraft({ ...draft, cardKicker })} />
              <Field label="Card title" value={draft.cardTitle} onChange={(cardTitle) => setDraft({ ...draft, cardTitle })} />
              <Field label="Submit label" value={draft.submitLabel} onChange={(submitLabel) => setDraft({ ...draft, submitLabel })} />
              <Field label="Busy label" value={draft.submitBusy} onChange={(submitBusy) => setDraft({ ...draft, submitBusy })} />
              <Field label="Footer text" value={draft.footer} onChange={(footer) => setDraft({ ...draft, footer })} />
              <Field label="Footer link text" value={draft.footerLink} onChange={(footerLink) => setDraft({ ...draft, footerLink })} />
            </>
          )}

          {section === 'pageAccount' && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Guest body" textarea value={draft.guestBody} onChange={(guestBody) => setDraft({ ...draft, guestBody })} />
              <Field label="Link label" value={draft.action} onChange={(action) => setDraft({ ...draft, action })} />
              <Field label="Link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
              <Field label="Card kicker" value={draft.cardKicker} onChange={(cardKicker) => setDraft({ ...draft, cardKicker })} />
              <Field label="Card title" value={draft.cardTitle} onChange={(cardTitle) => setDraft({ ...draft, cardTitle })} />
              <Field label="Orders eyebrow" value={draft.ordersEyebrow} onChange={(ordersEyebrow) => setDraft({ ...draft, ordersEyebrow })} />
              <Field label="Orders title" value={draft.ordersTitle} onChange={(ordersTitle) => setDraft({ ...draft, ordersTitle })} />
              <Field label="Orders empty body" textarea value={draft.ordersEmptyBody} onChange={(ordersEmptyBody) => setDraft({ ...draft, ordersEmptyBody })} />
              <Field label="Orders filled body" textarea value={draft.ordersFilledBody} onChange={(ordersFilledBody) => setDraft({ ...draft, ordersFilledBody })} />
              <Field label="Placed kicker" value={draft.placedKicker} onChange={(placedKicker) => setDraft({ ...draft, placedKicker })} />
              <Field label="Placed body ({number})" textarea value={draft.placedBody} onChange={(placedBody) => setDraft({ ...draft, placedBody })} />
              <EmptyFields value={draft.empty} onChange={(empty) => setDraft({ ...draft, empty })} />
            </>
          )}

          {section === 'pageNotFound' && draft && (
            <>
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              <Field label="Button label" value={draft.cta} onChange={(cta) => setDraft({ ...draft, cta })} />
              <Field label="Button link" value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
            </>
          )}

          {LEGAL_CMS[section] && draft && (
            <>
              <Field label="Eyebrow" value={draft.eyebrow} onChange={(eyebrow) => setDraft({ ...draft, eyebrow })} />
              <Field label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
              <Field label="Body" textarea value={draft.body} onChange={(body) => setDraft({ ...draft, body })} />
              {(draft.sections || []).map((s, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <Field label="Heading" value={s.heading} onChange={(heading) => {
                    const sections = [...draft.sections];
                    sections[i] = { ...s, heading };
                    setDraft({ ...draft, sections });
                  }} />
                  <Field label="Body" textarea value={s.body} onChange={(body) => {
                    const sections = [...draft.sections];
                    sections[i] = { ...s, body };
                    setDraft({ ...draft, sections });
                  }} />
                </div>
              ))}
            </>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button variant="ghost" onClick={() => setSection(null)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
