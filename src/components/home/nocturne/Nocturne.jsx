// Shared storefront pieces (product card, reveal and countdown hooks, facts tokens) and the site footer.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
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
import { showToast } from '../../layout/QuickToast';

export const HOUSE_IMAGES = { crystals: crystalsImg, rudraksha: rudrakshaImg, gemstones: gemstonesImg };

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

/* ---------------- product card ---------------- */

export function NCard({ product, badge }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => s.has(product._id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const { rating, reviewCount } = resolveProductRating(product);
  const was = product.originalPrice || product.compareAtPrice;
  const off = was > product.price ? Math.round((1 - product.price / was) * 100) : 0;
  const tag = badge || (product.flashSale && off ? `Flash -${off}%` : off ? `-${off}%` : null);
  const tagKind = !tag ? '' : /flash/i.test(tag) ? 'badge-flash' : /best|popular/i.test(tag) ? 'badge-bestseller' : 'badge-default';
  return (
    <div className="modern-product-card">
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
          onClick={() => {
            const saved = toggleWish(product);
            showToast(saved ? 'Saved to sacred wishlist' : 'Removed from sacred wishlist', saved ? 'gold' : 'muted');
          }}
        >
          <Heart size={16} stroke={wishlisted ? '#E05353' : '#222222'} fill={wishlisted ? '#E05353' : 'none'} strokeWidth={1.8} />
        </button>
        <div className="modern-quick-add">
          <button type="button" className="modern-quick-add-btn" onClick={() => addProduct(product, 1).then(() => showToast(`Added ${product.name} to your bag`), () => {})}>
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
        <div className="modern-product-subtitle">{product.shortDescription}</div>
        {rating > 0 && reviewCount > 0 && (
          <div className="modern-rating-row">
            <span className="modern-rating-star">★</span>
            <span className="modern-rating-val">{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</span>
            <span className="modern-reviews-count">· {formatReviewCount(reviewCount)} reviews</span>
          </div>
        )}
      </Link>
    </div>
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
  const copy = footer.copyright || name;
  const copyright = copy.includes('©') ? copy : `© ${new Date().getFullYear()} ${copy}`;
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
          <div>{copyright}</div>
          <div className="at-footer-bottom-right">
            <span>Secure checkout</span>
            {footer.location && <span>{footer.location}</span>}
          </div>
        </div>
        {footer.disclaimer && <p className="at-footer-note">{footer.disclaimer}</p>}
      </div>
    </footer>
  );
}
