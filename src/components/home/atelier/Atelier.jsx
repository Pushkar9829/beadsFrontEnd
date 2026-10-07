// Midnight Atelier home page sections. Every piece of copy comes from the CMS (home content);
// layout and order still come from the admin's Homepage layout (see pages/HomePage.jsx).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import api, { mediaUrl } from '../../../api/client';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { claimIcon } from '../../../lib/claimIcons';
import { resolveProductRating, formatReviewCount } from '../../../lib/productRating';
import { purposeToneStyle } from '../../customizer/PurposeGrid';
import Price from '../../ui/Price';
import heroFallback from '../../../assets/home/hero-bracelet.jpg';
import crystalsImg from '../../../assets/home/house-crystals.jpg';
import rudrakshaImg from '../../../assets/home/house-rudraksha.jpg';
import gemstonesImg from '../../../assets/home/house-gemstones.jpg';

const HOUSE_IMAGES = { crystals: crystalsImg, rudraksha: rudrakshaImg, gemstones: gemstonesImg };

/**
 * Fades a section in once it scrolls into view (skipped for reduced motion).
 * Returns a callback ref, so it also works for sections that only render after their data loads.
 */
export function useReveal() {
  const io = useRef(null);
  useEffect(() => () => io.current?.disconnect(), []);
  return useCallback((el) => {
    io.current?.disconnect();
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    io.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in');
          io.current?.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    io.current.observe(el);
  }, []);
}

function useCountdown(endsAt) {
  const calc = () => {
    const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const s = Math.floor(ms / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: ms <= 0 };
  };
  const [t, setT] = useState(() => (endsAt ? calc() : null));
  useEffect(() => {
    if (!endsAt) return undefined;
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);
  return t;
}

const pad = (n) => String(n).padStart(2, '0');

/** Renders "Heal. Align. Attract abundance." with the last word set in gold italic. */
function Accent({ text }) {
  const value = String(text || '').trim();
  const cut = value.lastIndexOf(' ');
  if (cut < 0) return <em>{value}</em>;
  return (
    <>
      {value.slice(0, cut)} <em>{value.slice(cut + 1)}</em>
    </>
  );
}

export function SectionHead({ eyebrow, title, body, to, action, children, center = false }) {
  return (
    <div className={`ma-head${center ? ' is-center' : ''}`}>
      <div className="ma-head-copy">
        {eyebrow && <p className="ma-eyebrow">{eyebrow}</p>}
        {title && <h2 className="ma-h2">{title}</h2>}
        {body && <p className="ma-lede">{body}</p>}
      </div>
      {children}
      {!children && to && action && (
        <Link to={to} className="ma-link">
          {String(action).replace(/\s*→\s*$/, '')}
        </Link>
      )}
    </div>
  );
}

/* ---------- Announcement bar ---------- */
export function AnnounceBar({ sale, copy = {} }) {
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  return (
    <div className="ma-announce" role="note">
      <span className="ma-announce-name">{sale.name}</span>
      <span className="ma-announce-sep">·</span>
      <span>timed atelier prices end in</span>
      <span className="ma-announce-time">
        {t.d}d {pad(t.h)}h {pad(t.m)}m
      </span>
      <Link to={copy.to || '/sale'} className="ma-announce-link">
        {String(copy.action || 'Shop the sale').replace(/\s*→\s*$/, '')}
      </Link>
    </div>
  );
}

/* ---------- Hero ---------- */
export function AtelierHero({ hero = {}, feature }) {
  const image = hero.image ? mediaUrl(hero.image) : heroFallback;
  const primary = hero.primaryCta || {};
  const secondary = hero.secondaryCta || {};
  return (
    <section className="ma-hero">
      <div className="ma-hero-copy">
        {hero.eyebrow && <p className="ma-eyebrow ma-rise">{hero.eyebrow}</p>}
        <h1 className="ma-hero-title ma-rise" style={{ '--d': '80ms' }}>
          <Accent text={hero.title || hero.brandName || 'Kuberstones'} />
        </h1>
        {hero.subtitle && (
          <p className="ma-hero-sub ma-rise" style={{ '--d': '160ms' }}>
            {hero.subtitle}
          </p>
        )}
        {(primary.label || secondary.label) && (
          <div className="ma-hero-ctas ma-rise" style={{ '--d': '240ms' }}>
            {primary.label && (
              <Link to={primary.to || '/customize'} className="ma-btn ma-btn-gold">
                {primary.label} <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            )}
            {secondary.label && (
              <Link to={secondary.to || '/shop'} className="ma-link">
                {secondary.label}
              </Link>
            )}
          </div>
        )}
        {hero.brandName && <p className="ma-hero-sign">{hero.brandName} · Handmade with intention</p>}
      </div>
      <div className="ma-hero-media">
        <img src={image} alt={hero.imageAlt || ''} fetchPriority="high" />
        {feature && (
          <Link to={`/p/${feature.slug}`} className="ma-hero-badge">
            {feature.images?.[0] && <img src={mediaUrl(feature.images[0])} alt="" />}
            <span>
              <b>{feature.name}</b>
              <span>
                {feature.shortDescription ? `${feature.shortDescription} · ` : ''}
                <Price value={feature.price} />
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/** Home-placement banners from the admin, as two quiet editorial tiles. */
export function BannerTiles({ banners = [] }) {
  if (!banners.length) return null;
  return (
    <div className="ma-wrap">
      <div className={`ma-banners is-${Math.min(2, banners.length)}`}>
        {banners.slice(0, 2).map((b) => (
          <Link key={b._id} to={b.link || '/shop'} className="ma-banner">
            <picture>
              {b.mobileImage && <source media="(max-width: 640px)" srcSet={mediaUrl(b.mobileImage)} />}
              <img src={mediaUrl(b.image)} alt={b.title || ''} loading="lazy" />
            </picture>
            {b.title && <span>{b.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- Promise strip (replaces the scrolling marquee) ---------- */
export function PromiseStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="ma-promise" aria-label="Kuberstones">
      <div className="ma-wrap ma-promise-row">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="ma-promise-item">
            {i > 0 && <i aria-hidden>✦</i>}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Three houses ---------- */
export function Houses({ copy = {} }) {
  const ref = useReveal();
  const items = copy.items || [];
  if (!items.length) return null;
  return (
    <section ref={ref} className="ma-section ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title}>
          {copy.body && <p className="ma-lede ma-head-aside">{copy.body}</p>}
        </SectionHead>
        <div className="ma-houses">
          {items.map((h, i) => {
            const img = h.image ? mediaUrl(h.image) : HOUSE_IMAGES[h.slug];
            return (
              <Link key={h.slug || h.name || i} to={`/${h.slug}`} className="ma-house" style={{ '--i': i }}>
                {img && <img src={img} alt="" loading="lazy" />}
                <span className="ma-house-cap">
                  {h.roman && <span className="ma-house-num">{h.roman}.</span>}
                  <span className="ma-house-name">{h.name}</span>
                  {h.blurb && <span className="ma-house-blurb">{h.blurb}</span>}
                  <span className="ma-house-go">{String(h.cta || 'Enter the house').replace(/\s*→\s*$/, '')} →</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Product card ---------- */
export function AtelierCard({ product }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => s.has(product._id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const { rating, reviewCount } = resolveProductRating(product);
  const was = product.originalPrice || product.compareAtPrice;
  const onSale = Boolean(product.flashSale) || (was && was > product.price);
  const image = product.images?.[0] ? mediaUrl(product.images[0]) : '';
  return (
    <article className="ma-card">
      <div className="ma-card-media" style={!image ? { background: product.colorHex || undefined } : undefined}>
        <Link to={`/p/${product.slug}`} tabIndex={-1} aria-hidden>
          {image && <img src={image} alt="" loading="lazy" />}
        </Link>
        {onSale && <span className="ma-card-tag">{product.flashSale ? 'Atelier price' : 'Sale'}</span>}
        <button
          type="button"
          className={`ma-card-heart${wishlisted ? ' is-on' : ''}`}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={() => toggleWish(product)}
        >
          <Heart size={15} strokeWidth={1.4} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="ma-card-add" onClick={() => addProduct(product, 1)}>
          <ShoppingBag size={13} strokeWidth={1.5} /> Add to bag
        </button>
      </div>
      <Link to={`/p/${product.slug}`} className="ma-card-meta">
        {product.family && <span className="ma-card-house">{product.family}</span>}
        <span className="ma-card-name">{product.name}</span>
        {product.shortDescription && <span className="ma-card-stones">{product.shortDescription}</span>}
        <span className="ma-card-price">
          <Price value={product.price} />
          {was > product.price && (
            <s>
              <Price value={was} />
            </s>
          )}
          {rating > 0 && (
            <span className="ma-card-rate" aria-label={`Rated ${rating} out of 5 from ${formatReviewCount(reviewCount)} reviews`}>
              <b>★</b> {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}
              {reviewCount ? ` (${formatReviewCount(reviewCount)})` : ''}
            </span>
          )}
        </span>
      </Link>
    </article>
  );
}

/** Show whole rows of four (5 → 4, 7 → 4, 9 → 8); fewer than four are shown as they are. */
function fullRows(n) {
  const capped = Math.min(n, 8);
  return capped < 4 ? capped : Math.floor(capped / 4) * 4;
}

/* ---------- Curated pieces: one tabbed grid instead of four repeated rails ---------- */
export function CuratedPieces({ copy = {}, tabs = [] }) {
  const ref = useReveal();
  const [active, setActive] = useState(0);
  const list = tabs.filter((t) => t.products?.length);
  if (!list.length) return null;
  const tab = list[Math.min(active, list.length - 1)];
  return (
    <section ref={ref} className="ma-section ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} body={copy.body}>
          {list.length > 1 && (
            <div className="ma-tabs" role="tablist" aria-label="Collections">
              {list.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={t === tab}
                  className={t === tab ? 'is-on' : ''}
                  onClick={() => setActive(i)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </SectionHead>
        <div className="ma-grid" key={tab.key}>
          {tab.products.slice(0, fullRows(tab.products.length)).map((p, i) => (
            <div key={p._id} className="ma-grid-item" style={{ '--i': i }}>
              <AtelierCard product={p} />
            </div>
          ))}
        </div>
        {tab.to && (
          <div className="ma-center">
            <Link to={tab.to} className="ma-btn ma-btn-ghost">
              {tab.action ? String(tab.action).replace(/\s*→\s*$/, '') : `View all ${tab.label.toLowerCase()}`}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Studio + ritual steps ---------- */
export function StudioSplit({ studio = {}, ritual = {}, image, showSteps = true }) {
  const ref = useReveal();
  const steps = showSteps ? ritual.steps || [] : [];
  const cta = studio.cta || studio.action;
  return (
    <section ref={ref} className="ma-section ma-alt ma-reveal">
      <div className="ma-wrap ma-split">
        <div className="ma-split-media">
          <img src={image} alt="" loading="lazy" />
        </div>
        <div>
          {studio.eyebrow && <p className="ma-eyebrow">{studio.eyebrow}</p>}
          <h2 className="ma-h2">{studio.heading || studio.title}</h2>
          {(studio.copy || studio.body) && <p className="ma-lede">{studio.copy || studio.body}</p>}
          {steps.length > 0 && (
            <ol className="ma-steps">
              {steps.map((s, i) => (
                <li key={s.n || s.title || i}>
                  <span className="ma-step-n">{s.n || pad(i + 1)}</span>
                  <span>
                    <span className="ma-step-title">{s.title}</span>
                    {s.body && <span className="ma-step-body">{s.body}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {cta && (
            <Link to={studio.to || '/customize'} className="ma-btn ma-btn-gold" style={{ marginTop: steps.length ? 0 : 36 }}>
              {String(cta).replace(/\s*→\s*$/, '')} <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** Ritual steps on their own (only used when the studio section is switched off). */
export function RitualRow({ ritual = {} }) {
  const ref = useReveal();
  const steps = ritual.steps || [];
  if (!steps.length) return null;
  return (
    <section ref={ref} className="ma-section ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={ritual.eyebrow} title={ritual.title} body={ritual.body} />
        <ol className="ma-columns">
          {steps.map((s, i) => (
            <li key={s.n || s.title || i}>
              <span className="ma-step-n">{s.n || pad(i + 1)}</span>
              <span className="ma-step-title">{s.title}</span>
              {s.body && <span className="ma-step-body">{s.body}</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Shop by purpose ---------- */
// A purpose is shown with the gemstone traditionally associated with it, instead of an illustration.
const PURPOSE_STONES = [
  [/love|relationship|heart|romance/i, ['rose-quartz', 'rhodonite']],
  [/money|wealth|abundance|prosper|luck/i, ['citrine', 'pyrite']],
  [/career|success|business|work/i, ['tiger-eye', 'citrine']],
  [/confidence|power|courage/i, ['carnelian', 'garnet', 'red-jasper']],
  [/protect|ground/i, ['black-tourmaline', 'obsidian', 'hematite']],
  [/calm|sleep|peace|anxiety|stress/i, ['amethyst', 'lepidolite']],
  [/focus|study|clarity|mind/i, ['fluorite', 'clear-quartz']],
  [/health|heal|energy|vital/i, ['clear-quartz', 'carnelian']],
  [/communicat|speak|express/i, ['sodalite', 'lapis-lazuli', 'blue-lace-agate']],
  [/spirit|meditat|intuition/i, ['labradorite', 'amethyst']],
  [/begin|new|fresh/i, ['moonstone', 'green-aventurine']],
  [/balance|harmony/i, ['green-aventurine', 'moonstone']],
];

function stoneFor(purpose, beadsBySlug) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  for (const [re, slugs] of PURPOSE_STONES) {
    if (!re.test(hay)) continue;
    const found = slugs.map((s) => beadsBySlug[s]).find((b) => b?.image);
    if (found) return found;
  }
  return null;
}

export function PurposeRow({ copy = {}, purposes = [], beads = [] }) {
  const ref = useReveal();
  if (!purposes.length) return null;
  const bySlug = Object.fromEntries(beads.map((b) => [b.slug, b]));
  return (
    <section ref={ref} className="ma-section ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} body={copy.body} to={copy.to || '/customize/purpose'} action={copy.action || 'All purposes'} />
        <div className="ma-purposes">
          {purposes.map((p) => {
            const stone = stoneFor(p, bySlug);
            return (
              <Link key={p._id || p.slug} to={`/customize?path=purpose&purpose=${p.slug}`} className="ma-purpose">
                <span className="ma-orb" style={purposeToneStyle(p)}>
                  {stone ? <img src={mediaUrl(stone.image)} alt="" loading="lazy" /> : <span className="ma-orb-tone" />}
                </span>
                <span className="ma-purpose-name">{p.name}</span>
                {p.description && <span className="ma-purpose-copy">{p.description}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Flash sale band ---------- */
export function SaleBand({ sale, products = [], copy = {} }) {
  const ref = useReveal();
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  return (
    <section ref={ref} className="ma-sale ma-reveal">
      <div className="ma-wrap">
        <div className="ma-sale-row">
          <div>
            <p className="ma-eyebrow ma-sale-eyebrow">✦ {copy.label || 'Flash sale'}</p>
            <h2 className="ma-h2">{sale.name}</h2>
            {copy.body && <p className="ma-lede">{copy.body}</p>}
          </div>
          <div className="ma-clock" aria-label={`Ends in ${t.d} days ${t.h} hours ${t.m} minutes`}>
            {[
              [t.d, 'Days'],
              [t.h, 'Hours'],
              [t.m, 'Mins'],
              [t.s, 'Secs'],
            ].map(([v, l]) => (
              <span key={l}>
                <b>{pad(v)}</b>
                <small>{l}</small>
              </span>
            ))}
          </div>
          <Link to={copy.to || '/sale'} className="ma-btn ma-btn-ghost">
            {String(copy.action || 'Shop the sale').replace(/\s*→\s*$/, '')}
          </Link>
        </div>
        {products.length > 0 && (
          <div className={`ma-grid ma-sale-grid${products.length <= 2 ? ' is-wide' : ''}`}>
            {products.slice(0, 4).map((p, i) => (
              <div key={p._id} className="ma-grid-item" style={{ '--i': i }}>
                <AtelierCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- One testimonial at a time ---------- */
function isImage(src = '') {
  return src && !/youtu|vimeo|\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

export function QuoteCarousel({ copy = {}, items = [] }) {
  const ref = useReveal();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(id);
  }, [count, paused]);
  if (!count) return null;
  const v = items[index % count];
  return (
    <section ref={ref} className="ma-section ma-quote ma-reveal" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ma-wrap">
        {copy.eyebrow && <p className="ma-eyebrow">{copy.eyebrow}</p>}
        <p className="ma-stars" aria-hidden>
          ★★★★★
        </p>
        <figure key={index} className="ma-quote-fig" aria-live="polite">
          <blockquote>“{v.quote}”</blockquote>
          <figcaption>
            {isImage(v.media) && <img src={mediaUrl(v.media)} alt="" />}
            <span>
              {v.name}
              {[v.place, v.piece].filter(Boolean).length > 0 && <small>{[v.place, v.piece].filter(Boolean).join(' · ')}</small>}
            </span>
          </figcaption>
        </figure>
        {count > 1 && (
          <div className="ma-dots">
            {items.map((item, i) => (
              <button key={`${item.name}-${i}`} type="button" aria-label={`Show quote from ${item.name}`} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Why Kuberstones ---------- */
export function TrustRow({ copy = {}, claims = [] }) {
  const ref = useReveal();
  if (!claims.length) return null;
  return (
    <section ref={ref} className="ma-section ma-alt ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
        <ul className="ma-columns ma-trust">
          {claims.map((c, i) => {
            const Icon = claimIcon(c);
            return (
              <li key={`${c.title}-${i}`}>
                <Icon size={22} strokeWidth={1.1} className="ma-trust-icon" />
                <span className="ma-step-title">{c.title}</span>
                {c.body && <span className="ma-step-body">{c.body}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function FaqList({ copy = {}, faqs = [] }) {
  const ref = useReveal();
  const [open, setOpen] = useState(faqs[0]?._id ?? null);
  if (!faqs.length) return null;
  return (
    <section ref={ref} className="ma-section ma-reveal">
      <div className="ma-wrap ma-narrow">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} to={copy.to || '/faq'} action={copy.action || 'All questions'} />
        <div className="ma-faq">
          {faqs.map((f) => {
            const isOpen = open === f._id;
            return (
              <div key={f._id} className={`ma-faq-item${isOpen ? ' is-open' : ''}`}>
                <button type="button" aria-expanded={isOpen} aria-controls={`ma-faq-${f._id}`} onClick={() => setOpen(isOpen ? null : f._id)}>
                  <span>{f.question}</span>
                  {isOpen ? <Minus size={16} strokeWidth={1.3} /> : <Plus size={16} strokeWidth={1.3} />}
                </button>
                <div id={`ma-faq-${f._id}`} className="ma-faq-panel" hidden={!isOpen}>
                  <p>{f.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Journal ---------- */
export function JournalRow({ copy = {}, posts = [] }) {
  const ref = useReveal();
  if (!posts.length) return null;
  return (
    <section ref={ref} className="ma-section ma-alt ma-reveal">
      <div className="ma-wrap">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} to={copy.to || '/journal'} action={copy.action || 'All notes'} />
        <div className={`ma-posts is-${Math.min(3, posts.length)}`}>
          {posts.map((p) => (
            <Link key={p._id} to={`/journal/${p.slug}`} className="ma-post">
              <span className="ma-post-media">{p.image ? <img src={mediaUrl(p.image)} alt="" loading="lazy" /> : <span className="ma-orb-tone" />}</span>
              {p.publishedAt && (
                <span className="ma-post-date">{new Date(p.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
              <span className="ma-post-title">{p.title}</span>
              {p.excerpt && <span className="ma-post-copy">{p.excerpt}</span>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */
export function Newsletter({ copy = {} }) {
  const ref = useReveal();
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, done: false, error: '' });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, done: false, error: '' });
    try {
      await api.post('/newsletter', { email, source: 'homepage' });
      setState({ busy: false, done: true, error: '' });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message || 'Could not subscribe. Please try again.' });
    }
  }
  return (
    <section ref={ref} className="ma-section ma-alt ma-letter ma-reveal">
      <div className="ma-wrap">
        <p className="ma-eyebrow">{copy.eyebrow || 'The list'}</p>
        <h2 className="ma-h2">{copy.title || 'Quiet notes from the atelier.'}</h2>
        {state.done ? (
          <p className="ma-lede">Thank you — you are on the list.</p>
        ) : (
          <form onSubmit={submit} className="ma-letter-form">
            <label htmlFor="ma-email" className="sr-only">
              Email address
            </label>
            <input id="ma-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" autoComplete="email" />
            <button type="submit" disabled={state.busy}>
              {state.busy ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {state.error && (
          <p className="ma-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- Finale ---------- */
export function Finale({ finale = {}, image }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="ma-finale ma-reveal">
      <img src={image} alt="" loading="lazy" />
      <div className="ma-finale-in">
        {finale.kicker && <p className="ma-eyebrow">{finale.kicker}</p>}
        {finale.title && (
          <h2 className="ma-finale-title">
            <Accent text={finale.title} />
          </h2>
        )}
        {finale.copy && <p className="ma-lede">{finale.copy}</p>}
        <div className="ma-finale-ctas">
          {finale.primaryCta?.label && (
            <Link to={finale.primaryCta.to || '/customize'} className="ma-btn ma-btn-gold">
              {finale.primaryCta.label} <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          )}
          {finale.secondaryCta?.label && (
            <Link to={finale.secondaryCta.to || '/shop'} className="ma-btn ma-btn-ghost">
              {finale.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
