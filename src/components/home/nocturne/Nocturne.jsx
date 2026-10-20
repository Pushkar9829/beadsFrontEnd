// Shared storefront pieces (product card, reveal and countdown hooks) plus the Nocturne home sections
// that have no atelier counterpart (shop the look, purposes, journal, finale) and the site footer.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { claimIcon } from '../../../lib/claimIcons';
import { resolveProductRating, formatReviewCount } from '../../../lib/productRating';
import { formatInr } from '../../../lib/format';
import crystalsImg from '../../../assets/home/house-crystals.jpg';
import rudrakshaImg from '../../../assets/home/house-rudraksha.jpg';
import gemstonesImg from '../../../assets/home/house-gemstones.jpg';
import emblem from '../../../assets/brand/emblem.png';

export const HOUSE_IMAGES = { crystals: crystalsImg, rudraksha: rudrakshaImg, gemstones: gemstonesImg };
const pad = (n) => String(n).padStart(2, '0');
const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

/* ---------------- helpers ---------------- */

/** Fade-in on scroll. Callback ref, so it also works for sections that render after data loads. */
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

export function useCountdown(endsAt) {
  const calc = useCallback(() => {
    const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const s = Math.floor(ms / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: ms <= 0 };
  }, [endsAt]);
  const [t, setT] = useState(() => (endsAt ? calc() : null));
  useEffect(() => {
    if (!endsAt) return undefined;
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt, calc]);
  return t;
}

/** "Wear your intention." → bold upper first part + gold italic last word. */
export function Display({ text, as: Tag = 'h2', className = '' }) {
  const value = String(text || '').trim();
  const cut = value.lastIndexOf(' ');
  return (
    <Tag className={`nx-d ${className}`}>
      {cut < 0 ? (
        <span className="nx-it">{value}</span>
      ) : (
        <>
          {value.slice(0, cut)} <span className="nx-it">{value.slice(cut + 1)}</span>
        </>
      )}
    </Tag>
  );
}

function Head({ eyebrow, title, body, children }) {
  return (
    <div className="nx-head">
      <div>
        {eyebrow && <p className="nx-eb">{eyebrow}</p>}
        {title && <Display text={title} className="nx-h2" />}
        {body && <p className="nx-lede">{body}</p>}
      </div>
      {children}
    </div>
  );
}

/** Replaces {tokens} with live numbers; returns null if any token has no data (the item is hidden). */
export function fillFacts(template, vars) {
  let missing = false;
  const out = String(template || '').replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    if (v === null || v === undefined || v === '') {
      missing = true;
      return '';
    }
    return v;
  });
  return missing ? null : out;
}

// The stone traditionally linked to a purpose, used for its photo.
const PURPOSE_STONES = [
  [/love|relationship|heart/i, ['rose-quartz', 'rhodonite']],
  [/money|wealth|abundance|prosper/i, ['citrine', 'pyrite']],
  [/career|success|work/i, ['tiger-eye', 'citrine']],
  [/confidence|power|courage/i, ['carnelian', 'garnet', 'red-jasper']],
  [/protect|ground/i, ['black-tourmaline', 'obsidian', 'hematite']],
  [/calm|sleep|relax|balance|emotional/i, ['amethyst', 'lepidolite']],
  [/focus|clarity/i, ['fluorite', 'clear-quartz']],
  [/energy|vital|health/i, ['carnelian', 'clear-quartz']],
  [/communicat|express/i, ['sodalite', 'lapis-lazuli', 'blue-lace-agate']],
  [/spirit|intuition/i, ['labradorite', 'amethyst']],
  [/begin|transform/i, ['moonstone', 'green-aventurine']],
];

function stoneFor(purpose, bySlug) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  for (const [re, slugs] of PURPOSE_STONES) {
    if (!re.test(hay)) continue;
    const found = slugs.map((s) => bySlug[s]).find((b) => b?.image);
    if (found) return found;
  }
  return null;
}

/* ---------------- product card ---------------- */

export function NCard({ product, badge }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => s.has(product._id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const { rating, reviewCount } = resolveProductRating(product);
  const was = product.originalPrice || product.compareAtPrice;
  const off = was > product.price ? Math.round((1 - product.price / was) * 100) : 0;
  const tag = badge || (product.flashSale && off ? `Flash −${off}%` : off ? `−${off}%` : null);
  const tagKind = !tag ? '' : /flash/i.test(tag) ? 'badge-flash' : /best|popular/i.test(tag) ? 'badge-bestseller' : 'badge-default';
  return (
    <article className="modern-product-card">
      <div className="modern-card-visual">
        <Link to={`/p/${product.slug}`} aria-label={product.name}>
          {product.images?.[0] ? (
            <img src={mediaUrl(product.images[0])} alt={product.name} className="modern-card-img" loading="lazy" />
          ) : (
            <span className="modern-card-img" style={{ background: product.colorHex }} />
          )}
        </Link>
        {tag && (
          <div className="modern-badge-wrap">
            <span className={`modern-card-badge ${tagKind}`}>{tag.toUpperCase()}</span>
          </div>
        )}
        <button
          type="button"
          className={`modern-wishlist-btn ${wishlisted ? 'is-active' : ''}`}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
          onClick={() => toggleWish(product)}
        >
          <Heart size={16} stroke={wishlisted ? '#E05353' : '#222222'} fill={wishlisted ? '#E05353' : 'none'} strokeWidth={1.8} />
        </button>
        <div className="modern-quick-add">
          <button type="button" className="modern-quick-add-btn" onClick={() => addProduct(product, 1)}>
            <ShoppingBag size={13} strokeWidth={1.8} />
            <span>Quick Add</span>
          </button>
        </div>
      </div>
      <Link to={`/p/${product.slug}`} className="modern-card-info">
        <div className="modern-info-top">
          <h3 className="modern-product-title">{product.name}</h3>
          <div className="modern-price-col">
            <span className="modern-current-price">{formatInr(product.price)}</span>
            {off > 0 && <span className="modern-original-price">{formatInr(was)}</span>}
          </div>
        </div>
        {product.shortDescription && <div className="modern-product-subtitle">{product.shortDescription}</div>}
        {rating > 0 && reviewCount > 0 && (
          <div className="modern-rating-row">
            <span className="modern-rating-star">★</span>
            <span className="modern-rating-val">{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</span>
            <span className="modern-reviews-count">· {formatReviewCount(reviewCount)} reviews</span>
          </div>
        )}
      </Link>
    </article>
  );
}

/* ---------------- 6. shop the look ---------------- */

export function NLook({ copy = {}, products = {} }) {
  const ref = useReveal();
  const addProduct = useCartStore((s) => s.addProduct);
  const looks = (copy.looks || [])
    .map((l) => ({ ...l, items: (l.items || []).map((it) => ({ ...it, product: products[it.productSlug] })).filter((it) => it.product) }))
    .filter((l) => l.image && l.items.length);
  const [lookIndex, setLookIndex] = useState(0);
  const [point, setPoint] = useState(0);
  if (!looks.length) return null;
  const look = looks[Math.min(lookIndex, looks.length - 1)];
  const active = look.items[Math.min(point, look.items.length - 1)];
  const total = look.items.reduce((sum, it) => sum + (Number(it.product.price) || 0), 0);
  return (
    <section ref={ref} className="nx-sec nx-reveal">
      <div className="nx-w nx-look">
        <div className="nx-look-ph">
          <img src={mediaUrl(look.image)} alt="" loading="lazy" />
          {look.items.map((it, i) => (
            <button
              key={`${it.productSlug}-${i}`}
              type="button"
              className={`nx-num${i === point ? ' is-on' : ''}`}
              style={{ left: `${it.x}%`, top: `${it.y}%` }}
              aria-label={`Show ${it.product.name}`}
              onClick={() => setPoint(i)}
            >
              {i + 1}
            </button>
          ))}
          {active && (
            <Link to={`/p/${active.product.slug}`} className="nx-pop" style={{ left: `min(${active.x}% + 22px, calc(100% - 280px))`, top: `calc(${active.y}% + 22px)` }}>
              {active.product.images?.[0] && <img src={mediaUrl(active.product.images[0])} alt="" />}
              <span>
                <b>{active.product.name}</b>
                <span>{formatInr(active.product.price)} · View piece</span>
              </span>
            </Link>
          )}
        </div>
        <div>
          <p className="nx-eb">{copy.eyebrow}</p>
          <Display text={look.title || copy.title} className="nx-h2" />
          {(look.body || copy.body) && <p className="nx-lede">{look.body || copy.body}</p>}
          <ol className="nx-look-list">
            {look.items.map((it, i) => (
              <li key={`${it.productSlug}-${i}`} className={i === point ? 'is-on' : ''} onMouseEnter={() => setPoint(i)}>
                <span className="nx-look-n">{i + 1}</span>
                <span className="nx-look-t">{it.product.images?.[0] && <img src={mediaUrl(it.product.images[0])} alt="" />}</span>
                <Link to={`/p/${it.product.slug}`}>
                  <b>{it.product.name}</b>
                  <span>{it.product.shortDescription || it.product.family}</span>
                </Link>
                <span>{formatInr(it.product.price)}</span>
              </li>
            ))}
          </ol>
          {look.items.length > 1 && (
            <button type="button" className="nx-btn nx-mt" onClick={() => look.items.forEach((it) => addProduct(it.product, 1))}>
              Add the look · {formatInr(total)}
            </button>
          )}
          {looks.length > 1 && (
            <div className="nx-looks">
              {looks.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show look ${i + 1}`}
                  className={i === lookIndex ? 'is-on' : ''}
                  onClick={() => {
                    setLookIndex(i);
                    setPoint(0);
                  }}
                >
                  <img src={mediaUrl(l.image)} alt="" />
                </button>
              ))}
              <span>{looks.length} looks</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 8. purposes ---------------- */

export function NPurposes({ copy = {}, purposes = [], beads = [] }) {
  const ref = useReveal();
  const bySlug = useMemo(() => Object.fromEntries(beads.map((b) => [b.slug, b])), [beads]);
  if (!purposes.length) return null;
  return (
    <section ref={ref} className="nx-sec nx-reveal">
      <div className="nx-w">
        <Head eyebrow={copy.eyebrow} title={copy.title}>
          <Link to={copy.to || '/customize/purpose'} className="nx-lnk">
            {clean(copy.action || 'All purposes')} →
          </Link>
        </Head>
        <div className="nx-purposes">
          {purposes.slice(0, 6).map((p, i) => {
            const stone = stoneFor(p, bySlug);
            return (
              <Link key={p._id || p.slug} to={`/customize?path=purpose&purpose=${p.slug}`} className="nx-pt">
                {stone ? <img src={mediaUrl(stone.image)} alt="" loading="lazy" /> : <span className="nx-pt-tone" />}
                <span className="nx-pt-k">{pad(i + 1)}</span>
                <span className="nx-pt-c">
                  <span className="nx-pt-n">{p.name}</span>
                  {p.description && <span className="nx-pt-p">{p.description}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 11. journal ---------------- */

export function NJournal({ copy = {}, posts = [] }) {
  const ref = useReveal();
  if (!posts.length) return null;
  return (
    <section ref={ref} className="nx-sec nx-reveal nx-pt0">
      <div className="nx-w">
        <Head eyebrow={copy.eyebrow} title={copy.title}>
          <Link to={copy.to || '/journal'} className="nx-lnk">
            {clean(copy.action || 'All notes')} →
          </Link>
        </Head>
        <div className={`nx-journal is-${Math.min(3, posts.length)}`}>
          {posts.slice(0, 3).map((p) => (
            <Link key={p._id} to={`/journal/${p.slug}`} className="nx-post">
              <span className="nx-post-ph">{p.image ? <img src={mediaUrl(p.image)} alt="" loading="lazy" /> : null}</span>
              {p.publishedAt && <span className="nx-post-k">{new Date(p.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span className="nx-post-h">{p.title}</span>
              {p.excerpt && <span className="nx-post-p">{p.excerpt}</span>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 13. finale ---------------- */

export function NFinale({ finale = {}, image }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="nx-end nx-reveal">
      <img src={image} alt="" loading="lazy" />
      <div className="nx-end-in">
        {finale.kicker && <p className="nx-eb">{finale.kicker}</p>}
        {finale.title && <Display text={finale.title} className="nx-end-h" />}
        {finale.copy && <p className="nx-lede">{finale.copy}</p>}
        <div className="nx-end-cta">
          {finale.primaryCta?.label && (
            <Link to={finale.primaryCta.to || '/customize'} className="nx-btn">
              {clean(finale.primaryCta.label)} <ArrowRight size={15} strokeWidth={1.6} />
            </Link>
          )}
          {finale.secondaryCta?.label && (
            <Link to={finale.secondaryCta.to || '/shop'} className="nx-btn nx-btn-o">
              {clean(finale.secondaryCta.label)}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer (atelier: styles/atelier/footer.css) ---------------- */

const FOOTER_TRUST = [
  { icon: 'sparkles', title: 'Certified Authentic', body: '100% genuine lab-verified mineral specimens' },
  { icon: 'hand', title: 'Hand-strung', body: 'Composed and strung by hand in our atelier' },
  { icon: 'heart', title: 'Restringing Guarantee', body: '7-day complimentary sizing adjustment' },
  { icon: 'shield', title: 'Vedic Consecration', body: 'Strung with sacred mantras before departure' },
];

export function NFooter({ footer = {}, brandName = 'KUBERSTONES' }) {
  const name = footer.brandName || brandName;
  const trust = (footer.trust?.length ? footer.trust : FOOTER_TRUST).slice(0, 4);
  // Two link columns, as in the source footer: policy links follow the care links in the second column.
  const groups = [
    [footer.shopHeading || 'Shop', footer.shopLinks || []],
    [footer.careHeading || 'Help', [...(footer.careLinks || []), ...(footer.legalLinks || [])]],
  ].filter(([, links]) => links.length);
  const payments = String(footer.payments || 'UPI, Cards, Netbanking')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <footer className="at-footer">
      <div className="container-custom at-footer-trust">
        <div className="at-footer-trust-grid">
          {trust.map((c, i) => {
            const Icon = claimIcon(c);
            return (
              <div key={`${c.title}-${i}`} className="at-footer-trust-item">
                <div className="at-footer-trust-icon">
                  <Icon size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h4>{c.title}</h4>
                  {c.body && <p>{c.body}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-custom">
        <div className="at-footer-cols">
          <div className="at-footer-brand-col">
            <Link to="/" className="at-footer-brand" aria-label={`${name} home`}>
              <img src={emblem} alt="" />
              <span>{String(name).toUpperCase()}</span>
            </Link>
            {footer.blurb && <p className="at-footer-manifesto">{footer.blurb}</p>}
            {payments.length > 0 && (
              <div className="at-footer-pills" aria-label="Secure payments">
                {payments.map((p) => (
                  <span key={p} className="at-footer-pill">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
          {groups.map(([title, links]) => (
            <div key={title}>
              <h4 className="at-footer-h">{title}</h4>
              <ul className="at-footer-links">
                {links.map((l) => (
                  <li key={`${l.to}-${l.label}`}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="at-footer-bottom">
          <div>{footer.copyright || `© ${new Date().getFullYear()} ${name}`}</div>
          <div className="at-footer-bottom-right">
            <span>{footer.tagline || 'Crystal associations are traditional, not medical claims.'}</span>
            {footer.instagram && (
              <a href={footer.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
          </div>
        </div>
        {footer.disclaimer && <p className="at-footer-note">{footer.disclaimer}</p>}
      </div>
    </footer>
  );
}
