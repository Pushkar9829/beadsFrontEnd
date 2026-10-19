// Home page sections in the atelier design, ported from beeds_ecommerce/src/pages/HomePage.jsx and
// components/StoneFinder.jsx. Markup follows the source; copy comes from the CMS (home content), order and
// visibility from the admin Homepage layout. Styles: styles/atelier/home.css, finder.css, home-port.css.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import api, { mediaUrl } from '../../../api/client';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { claimIcon } from '../../../lib/claimIcons';
import { resolveProductRating, formatReviewCount } from '../../../lib/productRating';
import { formatInr } from '../../../lib/format';
import { NCard, HOUSE_IMAGES, fillFacts, useCountdown } from '../nocturne/Nocturne';
import emblem from '../../../assets/brand/emblem.png';
import heroFallback from '../../../assets/home/hero-bracelet.jpg';
import kundaliBanner from '../../../assets/home/kundali-banner.webp';
import newsletterFallback from '../../../assets/home/newsletter-banner.jpg';

const pad = (n) => String(n).padStart(2, '0');
const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');
const img = (src, fallback = '') => (src ? mediaUrl(src) : fallback);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** "Heal. Align. Attract abundance." → ['Heal. Align.', 'Attract abundance.']; otherwise splits off the last word. */
export function splitTitle(text) {
  const value = String(text || '').trim();
  const sentence = value.match(/^(.*[.!?])\s+(\S.*)$/);
  if (sentence) return [sentence[1], sentence[2]];
  const cut = value.lastIndexOf(' ');
  return cut < 0 ? ['', value] : [value.slice(0, cut), value.slice(cut + 1)];
}

/** Section title: upper-case lead, gold italic close ("SACRED houses"). */
export function SectionTitle({ text, as: Tag = 'h2', className = 'section-title' }) {
  const [head, tail] = splitTitle(text);
  return (
    <Tag className={className}>
      {head && `${head.toUpperCase()} `}
      <span className="gold-italic">{tail}</span>
    </Tag>
  );
}

/* ---------------- 1. hero ---------------- */

export function AHero({ hero = {}, products = {} }) {
  const slides = useMemo(() => [hero, ...(hero.slides || []).filter((s) => s && (s.image || s.title))], [hero]);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(id);
  }, [count, paused, index]);

  const slide = { ...hero, ...slides[index % count] };
  const spotProduct = slide.hotspot?.productSlug ? products[slide.hotspot.productSlug] : null;
  const plaque = slide.plaque || (spotProduct ? spotProduct.name : '') || slide.imageAlt;
  const primary = slide.primaryCta || {};
  const secondary = slide.secondaryCta || {};
  const [head, tail] = splitTitle(slide.title || hero.brandName || 'Kuberstones');

  return (
    <section
      className="hero-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const diff = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40 && count > 1) (diff > 0 ? next : prev)();
        touchX.current = null;
      }}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={hero.brandName || 'Featured'}
    >
      <div className="hero-bg" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide-layer ${i === index % count ? 'is-active' : ''}`}>
            <img src={img(s.image, heroFallback)} alt="" className="hero-bg-img" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'low'} />
          </div>
        ))}
        <div className="hero-overlay-dark" />
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={prev} className="hero-nav-chevron hero-nav-prev" aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={next} className="hero-nav-chevron hero-nav-next" aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div className="hero-content container-custom">
        <div className="hero-editorial-wrap" key={index}>
          <div className="hero-eyebrow-row">
            <img src={emblem} alt="" className="hero-eyebrow-emblem" />
            {slide.eyebrow && <span className="section-eyebrow hero-eyebrow">{slide.eyebrow}</span>}
          </div>
          <h1 className="hero-headline">
            {head && (
              <>
                {head.toUpperCase()}
                <br />
              </>
            )}
            <span className="hero-headline-italic">{tail}</span>
          </h1>
          {slide.subtitle && <p className="hero-subtext">{slide.subtitle}</p>}
          <div className="hero-actions">
            {primary.label && (
              <Link to={primary.to || '/customize'} className="btn-gold hero-btn-primary">
                <span>{clean(primary.label)}</span>
                <ArrowRight size={14} />
              </Link>
            )}
            {secondary.label && (
              <Link to={secondary.to || '/shop'} className="btn-outline hero-btn-secondary">
                {clean(secondary.label)}
              </Link>
            )}
          </div>
        </div>

        {(count > 1 || plaque) && (
          <div className="hero-carousel-dock">
            {plaque && (
              <div className="hero-dock-badge">
                <span className="hero-dock-dot" />
                {spotProduct ? (
                  <Link to={`/p/${spotProduct.slug}`} className="hero-dock-specimen">
                    {plaque} · {formatInr(spotProduct.price)}
                  </Link>
                ) : (
                  <span className="hero-dock-specimen">{plaque}</span>
                )}
              </div>
            )}
            {count > 1 && (
              <div className="hero-dock-controls">
                <span className="hero-dock-counter">
                  <strong>{pad((index % count) + 1)}</strong>
                  <span className="counter-slash">/</span>
                  <span className="counter-total">{pad(count)}</span>
                </span>
                <div className="hero-dock-bars">
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`hero-dock-bar ${i === index % count ? 'is-active' : ''}`}
                      aria-label={`Show slide ${i + 1}`}
                    >
                      <span
                        key={i === index % count ? `fill-${index}-${paused ? 'p' : 'r'}` : `idle-${i}`}
                        className="hero-dock-fill"
                        style={{ animationPlayState: paused ? 'paused' : 'running' }}
                      />
                    </button>
                  ))}
                </div>
                <div className="hero-dock-arrows">
                  <button type="button" onClick={prev} className="hero-dock-arrow" aria-label="Previous slide">
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" onClick={next} className="hero-dock-arrow" aria-label="Next slide">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- 2. value bar (facts) ---------------- */

export function AValueBar({ items = [], vars = {} }) {
  const rows = items
    .map((it) => ({ value: fillFacts(it.value, vars), label: fillFacts(it.label, vars) }))
    .filter((it) => it.value && it.label !== null);
  if (!rows.length) return null;
  return (
    <div className="hero-value-bar reveal-on-scroll">
      <div className="container-custom">
        <div className="value-bar-grid is-auto" style={{ '--n': rows.length }}>
          {rows.map((r, i) => (
            <div key={i} className={`value-bar-item${i === 1 ? " value-bar-item-border" : ""}`}>
              <span className="value-roman">{ROMAN[i]}</span>
              <span>
                {r.value} {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3. houses ---------------- */

export function AHouses({ houses = {}, studio = {}, counts = {} }) {
  const items = (houses.items || []).slice(0, 3);
  if (!items.length) return null;
  const [big, ...rest] = items;
  const plate = (h, i, primary) => {
    const roman = h.roman || ROMAN[i];
    const n = counts[h.slug];
    return (
      <Link key={h.slug || i} to={`/${h.slug}`} className={`luxury-card house-plate ${primary ? 'house-plate-primary' : 'house-plate-secondary'}`}>
        <div className="house-plate-img-wrap">
          <img src={img(h.image, HOUSE_IMAGES[h.slug])} alt={h.name} className="house-img" loading="lazy" />
          <div className="house-plate-gradient" />
        </div>
        <div className="house-plate-content">
          <div className="house-plate-top">
            <span className="house-roman-label">House {roman}{h.kicker ? ` · ${h.kicker}` : ''}</span>
            {n > 0 && <span className="house-specimen-count">{n} {n === 1 ? 'piece' : 'pieces'}</span>}
          </div>
          <h3 className={primary ? 'house-title' : 'house-title-sm'}>{String(h.name).toUpperCase()}</h3>
          {h.blurb && <p className={primary ? 'house-desc' : 'house-desc-sm'}>{h.blurb}</p>}
          <div className="house-action-line">
            <span>
              {houses.exploreLabel || 'Explore House'} {roman}
            </span>
            <ArrowRight size={primary ? 14 : 13} />
          </div>
        </div>
      </Link>
    );
  };
  return (
    <section className="section-houses">
      <div className="container-custom">
        <div className="section-header-editorial reveal-on-scroll">
          {houses.eyebrow && <span className="section-eyebrow">{houses.eyebrow}</span>}
          <div className="section-header-split">
            <SectionTitle text={houses.title} />
            {houses.body && <p className="section-subtitle">{houses.body}</p>}
          </div>
        </div>

        <div className="houses-editorial-layout reveal-stagger">
          {plate(big, 0, true)}
          <div className="houses-staggered-col">
            {rest[0] && plate(rest[0], 1, false)}
            <Link to={studio.to || '/customize'} className="luxury-card house-plate house-plate-atelier">
              <div className="house-plate-content">
                <div className="house-plate-top">
                  <span className="house-roman-label">{studio.eyebrow || 'The studio'}</span>
                  <Sparkles size={13} color="#C5A572" />
                </div>
                <h3 className="house-title-sm">{String(studio.heading || studio.title || 'Compose your own').toUpperCase()}</h3>
                {(studio.copy || studio.body) && <p className="house-desc-sm">{studio.copy || studio.body}</p>}
                <div className="house-action-line">
                  <span>{clean(studio.cta || studio.action || 'Open the studio')}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </Link>
            {rest[1] && plate(rest[1], 2, false)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4. collection (chosen often) ---------------- */

export function ACollection({ copy = {}, tabs = [] }) {
  const list = tabs.filter((t) => t.products?.length);
  const [active, setActive] = useState(0);
  const [page, setPage] = useState(0);
  const tab = list[Math.min(active, Math.max(0, list.length - 1))];
  if (!tab) return null;
  const perPage = 4;
  const products = tab.products.slice(0, 12);
  const pages = Math.ceil(products.length / perPage) || 1;
  const at = page % pages;
  const spread = products.slice(at * perPage, at * perPage + perPage);
  const shown = spread.length >= perPage || products.length <= perPage ? spread : [...spread, ...products.slice(0, perPage - spread.length)];
  const [head, tail] = splitTitle(copy.title);
  return (
    <section className="section-featured">
      <div className="container-custom">
        <div className="collection-header-row reveal-on-scroll">
          <div className="collection-title-col">
            {copy.eyebrow && (
              <div className="collection-eyebrow-wrap">
                <span className="collection-eyebrow">{copy.eyebrow}</span>
                <span className="collection-eyebrow-dash" />
              </div>
            )}
            <h2 className="collection-title">
              {head && `${head} `}
              <span className="collection-italic">{tail}</span>
            </h2>
            {copy.body && <p className="collection-subtitle">{copy.body}</p>}
          </div>

          <div className="collection-controls-col">
            {list.length > 1 && (
              <div className="collection-pills" role="tablist" aria-label="Collections">
                {list.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={t === tab}
                    onClick={() => {
                      setActive(i);
                      setPage(0);
                    }}
                    className={`collection-pill ${t === tab ? 'is-active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {pages > 1 && (
              <div className="collection-nav-arrows">
                <button type="button" onClick={() => setPage((p) => (p - 1 + pages) % pages)} className="collection-arrow-btn" aria-label="Previous pieces">
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <button type="button" onClick={() => setPage((p) => (p + 1) % pages)} className="collection-arrow-btn" aria-label="Next pieces">
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chosen-often-grid reveal-stagger">
          {shown.map((p) => (
            <NCard key={`${tab.key}-${p._id}`} product={p} />
          ))}
        </div>

        <div className="section-cta-center">
          <Link to={tab.to || copy.to || '/shop'} className="collection-see-all-btn">
            {clean(tab.action || copy.action) || `View all ${tab.label.toLowerCase()}`}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5. flash sale ---------------- */

export function AFlash({ sale, products = [], copy = {} }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  const units = t.d > 0 ? [[t.d, 'Days'], [t.h, 'Hours'], [t.m, 'Minutes']] : [[t.h, 'Hours'], [t.m, 'Minutes'], [t.s, 'Seconds']];
  return (
    <section className="section-flash">
      <div className="container-custom">
        <div className="flash-editorial-grid">
          <div className="flash-info reveal-left">
            <span className="section-eyebrow flash-eyebrow">
              <Clock size={12} color="#C5A572" />
              {copy.label || 'Flash sale'} · {sale.name}
            </span>
            <SectionTitle text={copy.title || 'A short list, briefly.'} className="section-title flash-title" />
            {copy.body && <p className="flash-desc">{copy.body}</p>}
            <div className="countdown-row" aria-label={`Ends in ${t.d} days ${t.h} hours ${t.m} minutes`}>
              {units.map(([v, l], i) => (
                <Fragment key={l}>
                  {i > 0 && <span className="countdown-divider">/</span>}
                  <div className="countdown-box">
                    <div className="countdown-value">{pad(v)}</div>
                    <div className="countdown-label">{l.toUpperCase()}</div>
                  </div>
                </Fragment>
              ))}
            </div>
            <Link to={copy.to || '/sale'} className="btn-gold flash-cta">
              <span>{clean(copy.action || 'Shop the sale')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {products.length > 0 && (
            <div className="flash-products-stagger reveal-right">
              {products.slice(0, 2).map((p, idx) => {
                const was = p.originalPrice || p.compareAtPrice;
                const off = was > p.price ? Math.round((1 - p.price / was) * 100) : 0;
                const { rating } = resolveProductRating(p);
                return (
                  <div key={p._id} className={`flash-specimen-card ${idx === 1 ? 'stagger-down' : ''}`}>
                    <Link to={`/p/${p.slug}`} className="flash-img-plate">
                      {p.images?.[0] && <img src={mediaUrl(p.images[0])} alt={p.name} className="product-card-img" />}
                      {off > 0 && (
                        <div className="flash-badge-architectural">
                          {copy.label || 'Flash'} −{off}%
                        </div>
                      )}
                    </Link>
                    <div className="flash-specimen-info">
                      <div>
                        {rating > 0 && (
                          <div className="flash-stars-row">
                            <span className="flash-star">★</span>
                            <span className="flash-rating">{rating.toFixed(1)}</span>
                          </div>
                        )}
                        <h4 className="flash-specimen-name">
                          <Link to={`/p/${p.slug}`}>{p.name}</Link>
                        </h4>
                        {p.shortDescription && <p className="flash-specimen-tagline">{p.shortDescription}</p>}
                      </div>
                      <div className="flash-specimen-footer">
                        <div className="flash-pricing-wrap">
                          <span className="flash-price">{formatInr(p.price)}</span>
                          {off > 0 && <span className="flash-original-price">{formatInr(was)}</span>}
                        </div>
                        <button type="button" onClick={() => addProduct(p, 1)} className="flash-acquire-btn">
                          <ShoppingBag size={12} />
                          <span>{copy.addLabel || 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5b. kundali offer ---------------- */

const LOTUS = (
  <svg width="22" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <path d="M12 2C12 2 8 8 8 13C8 15.2 9.8 17 12 17C14.2 17 16 15.2 16 13C16 8 12 2 12 2Z" />
    <path d="M12 17C9 17 5 14 4 10C6 10 9 12 11 15" />
    <path d="M12 17C15 17 19 14 20 10C18 10 15 12 13 15" />
    <path d="M3 13C3 13 4 15 6 16" />
    <path d="M21 13C21 13 20 15 18 16" />
  </svg>
);

const KUNDALI_ICONS = {
  bag: <ShoppingBag size={22} strokeWidth={1.3} />,
  cart: <ShoppingCart size={22} strokeWidth={1.3} />,
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="12" cy="14" r="3" strokeDasharray="1.5 1.5" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="12" y1="11" x2="12" y2="17" />
    </svg>
  ),
};

export function AKundali({ copy = {} }) {
  const [open, setOpen] = useState(false);
  const threshold = copy.threshold || '₹2,000';
  const fill = (v) => String(v || '').replace(/\{threshold\}/g, threshold);
  const steps = (copy.steps || []).slice(0, 3).map((st) => ({
    icon: KUNDALI_ICONS[st.icon] || KUNDALI_ICONS.bag,
    title: [fill(st.titleLead), fill(st.titleTail)],
    body: fill(st.body),
  }));
  return (
    <section className="section-kundali-offer">
      <div className="container-custom">
        <div className="kundali-banner-wrapper">
          <div className="kundali-banner-backdrop">
            <img src={img(copy.image, kundaliBanner)} alt="" className="kundali-backdrop-img" loading="lazy" />
          </div>

          <div className="kundali-rosette-seal" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="rosette-svg">
              <defs>
                <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DFCA9E" />
                  <stop offset="35%" stopColor="#C5A572" />
                  <stop offset="70%" stopColor="#F0DFB8" />
                  <stop offset="100%" stopColor="#9E7D46" />
                </linearGradient>
                <radialGradient id="sealDarkGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#251233" />
                  <stop offset="100%" stopColor="#120617" />
                </radialGradient>
                <filter id="sealGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.85" />
                  <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#C5A572" floodOpacity="0.25" />
                </filter>
              </defs>
              <g filter="url(#sealGlow)">
                <path
                  d="M 188.00,100.00 Q 194.19,112.40 185.00,122.78 Q 187.77,136.35 176.21,144.00 Q 175.37,157.83 162.23,162.23 Q 157.83,175.37 144.00,176.21 Q 136.35,187.77 122.78,185.00 Q 112.40,194.19 100.00,188.00 Q 87.60,194.19 77.22,185.00 Q 63.65,187.77 56.00,176.21 Q 42.17,175.37 37.77,162.23 Q 24.63,157.83 23.79,144.00 Q 12.23,136.35 15.00,122.78 Q 5.81,112.40 12.00,100.00 Q 5.81,87.60 15.00,77.22 Q 12.23,63.65 23.79,56.00 Q 24.63,42.17 37.77,37.77 Q 42.17,24.63 56.00,23.79 Q 63.65,12.23 77.22,15.00 Q 87.60,5.81 100.00,12.00 Q 112.40,5.81 122.78,15.00 Q 136.35,12.23 144.00,23.79 Q 157.83,24.63 162.23,37.77 Q 175.37,42.17 176.21,56.00 Q 187.77,63.65 185.00,77.22 Q 194.19,87.60 188.00,100.00 Z"
                  fill="url(#sealDarkGrad)"
                  stroke="url(#sealGoldGrad)"
                  strokeWidth="2.4"
                />
                <path
                  d="M 180.00,100.00 Q 185.26,111.23 177.27,120.71 Q 179.45,132.91 169.28,140.00 Q 168.23,152.35 156.57,156.57 Q 152.35,168.23 140.00,169.28 Q 132.91,179.45 120.71,177.27 Q 111.23,185.26 100.00,180.00 Q 88.77,185.26 79.29,177.27 Q 67.09,179.45 60.00,169.28 Q 47.65,168.23 43.43,156.57 Q 31.77,152.35 30.72,140.00 Q 20.55,132.91 22.73,120.71 Q 14.74,111.23 20.00,100.00 Q 14.74,88.77 22.73,79.29 Q 20.55,67.09 30.72,60.00 Q 31.77,47.65 43.43,43.43 Q 47.65,31.77 60.00,30.72 Q 67.09,20.55 79.29,22.73 Q 88.77,14.74 100.00,20.00 Q 111.23,14.74 120.71,22.73 Q 132.91,20.55 140.00,30.72 Q 152.35,31.77 156.57,43.43 Q 168.23,47.65 169.28,60.00 Q 179.45,67.09 177.27,79.29 Q 185.26,88.77 180.00,100.00 Z"
                  fill="none"
                  stroke="url(#sealGoldGrad)"
                  strokeWidth="1.1"
                  opacity="0.88"
                />
                <circle cx="100" cy="100" r="74" fill="none" stroke="url(#sealGoldGrad)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <g transform="translate(88, 35) scale(0.65)" stroke="url(#sealGoldGrad)" strokeWidth="1.6" fill="none">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </g>
                <text x="100" y="86" textAnchor="middle" fill="url(#sealGoldGrad)" fontFamily="'Cinzel', serif" fontSize="23" fontWeight="800" letterSpacing="0.08em">
                  {copy.sealTop || 'FREE'}
                </text>
                <text x="100" y="106" textAnchor="middle" fill="url(#sealGoldGrad)" fontFamily="'Cinzel', serif" fontSize="13.5" fontWeight="600" letterSpacing="0.26em">
                  {copy.sealName || 'KUNDALI'}
                </text>
                <line x1="56" y1="117" x2="144" y2="117" stroke="url(#sealGoldGrad)" strokeWidth="0.8" opacity="0.75" />
                <text x="100" y="130" textAnchor="middle" fill="#DFCA9E" fontFamily="'Outfit', sans-serif" fontSize="8.5" fontWeight="600" letterSpacing="0.18em">
                  {copy.sealLine || 'ON ORDERS ABOVE'}
                </text>
                <text x="100" y="153" textAnchor="middle" fill="url(#sealGoldGrad)" fontFamily="'Cinzel', serif" fontSize="18" fontWeight="800" letterSpacing="0.04em">
                  {threshold}
                </text>
              </g>
            </svg>
          </div>

          <div className="kundali-content-layer">
            <div className="kundali-eyebrow">
              <span className="eyebrow-rule" />
              <span className="eyebrow-lotus">{LOTUS}</span>
              <span className="eyebrow-text">{String(copy.eyebrow || 'Exclusive offer').toUpperCase()}</span>
              <span className="eyebrow-rule" />
            </div>

            <h2 className="kundali-title">
              {copy.titleLead || 'Your Kundali,'}
              <br />
              <span className="kundali-title-italic">{copy.titleTail || 'on us'}</span>
              <span className="kundali-sparkle">✦</span>
            </h2>

            <p className="kundali-paragraph">
              {copy.bodyLead} <strong className="kundali-bold-text">{copy.bodyHighlight}</strong> {copy.bodyTail}{' '}
              <strong className="kundali-bold-text">{threshold}</strong>.
            </p>

            <div className="kundali-steps-track">
              <div className="kundali-steps-line" />
              {steps.map((s, i) => (
                <div key={i} className="kundali-step-item">
                  <div className="kundali-step-header">
                    <span className="kundali-step-badge">{i + 1}</span>
                    <span className="kundali-step-icon">{s.icon}</span>
                  </div>
                  <h4 className="kundali-step-heading">
                    {s.title[0]}
                    <br />
                    {s.title[1]}
                  </h4>
                  <p className="kundali-step-desc">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="kundali-cta-row">
              <button type="button" onClick={() => setOpen(true)} className="btn-kundali-action">
                <span>{String(copy.action || 'Avail the offer').toUpperCase()}</span>
                <span className="btn-circle-arrow">
                  <ArrowRight size={13} strokeWidth={2} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && <KundaliModal copy={copy} threshold={threshold} onClose={() => setOpen(false)} />}
    </section>
  );
}

/** Two-part title: "Lead <gold italic>Tail</gold italic>". */
function GoldTail({ lead, tail }) {
  return (
    <>
      {lead} {tail && <span className="gold-italic">{tail}</span>}
    </>
  );
}

// "Avail the offer" popup (source: HomePage.jsx, KUNDALI OFFER POPUP MODAL). The source only shows a success
// state; here the birth details are sent to the Contact inbox so the team can prepare the Kundali.
function KundaliModal({ copy, threshold, onClose }) {
  const navigate = useNavigate();
  const user = useAuthStore((st) => st.user);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', placeOfBirth: '', dob: '', tob: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const fill = (v) => String(v || '').replace(/\{threshold\}/g, threshold);
  // Body text with tokens; {threshold} and {name} render bold, as in the source.
  const rich = (v, values) =>
    String(v || '')
      .split(/(\{threshold\}|\{name\}|\{place\})/g)
      .map((part, i) => {
        const key = part.slice(1, -1);
        if (!(part.startsWith('{') && key in values)) return part;
        return key === 'place' ? values.place : <strong key={i} className="modal-strong">{values[key]}</strong>;
      });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.placeOfBirth.trim() || !form.dob) {
      setError('Please provide your name, email, place of birth and date of birth.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        message: [
          `Kundali offer request (orders above ${threshold})`,
          `Name: ${form.name.trim()}`,
          `Place of birth: ${form.placeOfBirth.trim()}`,
          `Date of birth: ${form.dob}`,
          `Time of birth: ${form.tob || 'not given'}`,
        ].join('\n'),
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not send. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="kundali-modal-backdrop" onClick={onClose}>
      <div className="kundali-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="kundali-modal-title">
        <div className="modal-ambient-glow" />
        <div className="modal-diya-glow" />
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={17} strokeWidth={2} />
        </button>

        {!sent ? (
          <div className="modal-inner-content">
            <div className="modal-eyebrow">
              <span className="eyebrow-rule" />
              <span className="eyebrow-lotus">{LOTUS}</span>
              <span className="eyebrow-text">{String(copy.modalEyebrow || 'Free Vedic Kundali offer').toUpperCase()}</span>
              <span className="eyebrow-rule" />
            </div>
            <h3 className="modal-title" id="kundali-modal-title">
              <GoldTail lead={copy.modalTitleLead || 'Inscribe Your'} tail={copy.modalTitleTail ?? 'Birth Details'} />
            </h3>
            <p className="modal-subtext">{rich(copy.modalBody, { threshold })}</p>

            <form onSubmit={submit} className="kundali-modal-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="kundali-name">
                  <User size={13} className="label-icon" />
                  <span>Full Name</span>
                </label>
                <div className="input-wrap">
                  <input id="kundali-name" type="text" required placeholder="e.g. Arjun Sharma" value={form.name} onChange={set('name')} className="modal-input" autoComplete="name" />
                </div>
              </div>
              {!user?.email && (
                <div className="form-group">
                  <label className="form-label" htmlFor="kundali-email">
                    <Mail size={13} className="label-icon" />
                    <span>Email</span>
                  </label>
                  <div className="input-wrap">
                    <input id="kundali-email" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} className="modal-input" autoComplete="email" />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="kundali-place">
                  <MapPin size={13} className="label-icon" />
                  <span>Place of Birth (City / State / Country)</span>
                </label>
                <div className="input-wrap">
                  <input id="kundali-place" type="text" required placeholder="e.g. Varanasi, Uttar Pradesh" value={form.placeOfBirth} onChange={set('placeOfBirth')} className="modal-input" />
                </div>
              </div>
              <div className="form-row-duo">
                <div className="form-group">
                  <label className="form-label" htmlFor="kundali-dob">
                    <Calendar size={13} className="label-icon" />
                    <span>Date of Birth</span>
                  </label>
                  <div className="input-wrap">
                    <input id="kundali-dob" type="date" required value={form.dob} onChange={set('dob')} className="modal-input date-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="kundali-tob">
                    <Clock size={13} className="label-icon" />
                    <span>Time of Birth</span>
                  </label>
                  <div className="input-wrap">
                    <input id="kundali-tob" type="time" value={form.tob} onChange={set('tob')} className="modal-input time-input" />
                  </div>
                </div>
              </div>
              {copy.modalHint && <div className="form-hint">{copy.modalHint}</div>}
              {error && (
                <p className="form-hint kundali-modal-error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn-kundali-action modal-submit-btn" disabled={busy}>
                  <span>{busy ? 'SENDING…' : fill(copy.modalAction || 'Confirm & avail offer').toUpperCase()}</span>
                  <span className="btn-circle-arrow">
                    <ArrowRight size={13} strokeWidth={2} />
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="modal-success-content">
            <div className="success-badge-rosette">
              <span className="success-check-icon">✓</span>
            </div>
            <div className="modal-eyebrow modal-eyebrow-center">
              <span className="eyebrow-rule" />
              <span className="eyebrow-text">{String(copy.successEyebrow || 'Vedic consecration reserved').toUpperCase()}</span>
              <span className="eyebrow-rule" />
            </div>
            <h3 className="modal-title modal-title-success">
              <GoldTail lead={copy.successTitleLead || 'Your Kundali Is'} tail={copy.successTitleTail ?? 'Reserved'} />
            </h3>
            <p className="modal-subtext modal-subtext-success">
              {rich(copy.successBody, { threshold, name: form.name.trim(), place: form.placeOfBirth.trim() })}
            </p>
            <div className="success-summary-card">
              <div className="summary-row">
                <span className="summary-label">Native:</span>
                <span className="summary-val">{form.name}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Birth Coordinates:</span>
                <span className="summary-val">{form.placeOfBirth}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Date & Time:</span>
                <span className="summary-val">
                  {form.dob} {form.tob ? `· ${form.tob}` : ''}
                </span>
              </div>
              <div className="summary-row summary-row-status">
                <span className="summary-label">Status:</span>
                <span className="summary-val summary-val-gold">{fill(copy.successStatus || 'Complimentary on {threshold}+ orders').toUpperCase()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(copy.to || '/shop');
              }}
              className="btn-kundali-action btn-kundali-wide"
            >
              <span>{fill(copy.successAction || 'Explore sacred pieces ({threshold}+)').toUpperCase()}</span>
              <span className="btn-circle-arrow">
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- 6. stone finder (the oracle) ---------------- */

export function AFinder({ copy = {}, purposes = [] }) {
  const options = purposes.slice(0, Number(copy.purposeLimit) || 6);
  const [purpose, setPurpose] = useState(null);
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [state, setState] = useState({ loading: false, data: null, error: '', byDate: false });
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const ask = useCallback(async (params) => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await api.get('/customizer/finder', { params });
      setState({ loading: false, data, error: '', byDate: Boolean(params.dob) });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message || 'Could not find stones right now.', byDate: false });
    }
  }, []);
  // Show a result straight away for the first purpose, once.
  const started = useRef(false);
  const firstSlug = options[0]?.slug;
  useEffect(() => {
    if (started.current || !firstSlug) return;
    started.current = true;
    setPurpose(firstSlug);
    ask({ purpose: firstSlug });
  }, [firstSlug, ask]);
  if (!options.length) return null;
  const dobValid = /^\d{1,2}$/.test(dob.d) && /^\d{1,2}$/.test(dob.m) && /^\d{4}$/.test(dob.y);
  const onDob = (e) => {
    e.preventDefault();
    if (!dobValid) return;
    setPurpose(null);
    ask({ dob: `${dob.y}-${pad(dob.m)}-${pad(dob.d)}` });
  };
  const digits = (v, n) => v.replace(/\D/g, '').slice(0, n);
  const r = state.data;
  const [head, tail] = splitTitle(copy.title || 'Find your stone.');
  const productRating = r?.product ? resolveProductRating(r.product).rating : 0;
  return (
    <section id="stone-finder" className="section-oracle-finder">
      <div className="container-custom">
        <div className="oracle-showcase-card reveal-on-scroll">
          <div className="oracle-grid-layout">
            <div className="oracle-left-col">
              <div className="collection-eyebrow-wrap oracle-eyebrow-row">
                <span className="collection-eyebrow">{copy.eyebrow || 'Stone finder'}</span>
                <span className="collection-eyebrow-dash" />
              </div>
              <h2 className="collection-title oracle-title">
                {head && `${head.toUpperCase()} `}
                <span className="collection-italic">{tail}</span>
              </h2>
              {copy.body && <p className="collection-subtitle oracle-subtitle">{copy.body}</p>}

              <div className="oracle-step-header">
                <div className="oracle-step-badge">I</div>
                <span className="oracle-step-label">{copy.askLabel || 'Select intention or alignment'}</span>
              </div>

              <div className="oracle-intentions-grid">
                {options.map((p) => {
                  const on = purpose === p.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setPurpose(p.slug);
                        ask({ purpose: p.slug });
                      }}
                      className={`oracle-intent-pill ${on ? 'is-active' : ''}`}
                    >
                      <span className="intent-pill-title">{p.name}</span>
                      <span className="intent-pill-check">{on ? <Check size={12} strokeWidth={2.8} /> : <span className="intent-dot" />}</span>
                    </button>
                  );
                })}
              </div>

              <div className="oracle-date-divider">
                <span className="date-divider-line" />
                <span className="date-divider-text">{copy.orLabel || 'Or by birth date'}</span>
                <span className="date-divider-line" />
              </div>

              <form onSubmit={onDob} className="oracle-date-form">
                <div className="oracle-date-inputs">
                  <div className="date-field">
                    <input
                      inputMode="numeric"
                      placeholder="DD"
                      value={dob.d}
                      maxLength={2}
                      className="oracle-input"
                      aria-label="Birth day"
                      onChange={(e) => {
                        const d = digits(e.target.value, 2);
                        setDob({ ...dob, d });
                        if (d.length === 2) monthRef.current?.focus();
                      }}
                    />
                    <span className="date-field-sub">Day</span>
                  </div>
                  <span className="date-sep">/</span>
                  <div className="date-field">
                    <input
                      ref={monthRef}
                      inputMode="numeric"
                      placeholder="MM"
                      value={dob.m}
                      maxLength={2}
                      className="oracle-input"
                      aria-label="Birth month"
                      onChange={(e) => {
                        const m = digits(e.target.value, 2);
                        setDob({ ...dob, m });
                        if (m.length === 2) yearRef.current?.focus();
                      }}
                    />
                    <span className="date-field-sub">Month</span>
                  </div>
                  <span className="date-sep">/</span>
                  <div className="date-field date-field-year">
                    <input
                      ref={yearRef}
                      inputMode="numeric"
                      placeholder="YYYY"
                      value={dob.y}
                      maxLength={4}
                      className="oracle-input oracle-input-year"
                      aria-label="Birth year"
                      onChange={(e) => setDob({ ...dob, y: digits(e.target.value, 4) })}
                    />
                    <span className="date-field-sub">Year</span>
                  </div>
                </div>
                <button type="submit" className="oracle-date-btn" aria-label="Find stones for this birth date">
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
                {state.byDate && r?.label && (
                  <div className="oracle-zodiac-pill">
                    <Sparkles size={13} className="zodiac-sparkle" />
                    <span>
                      <strong>{r.label}</strong>
                    </span>
                  </div>
                )}
              </form>
            </div>

            <div className="oracle-col-divider" />

            <div className={`oracle-right-col${state.loading ? ' is-loading' : ''}`} aria-live="polite">
              {state.error && <p className="oracle-cta-note">{state.error}</p>}
              {r && (
                <>
                  <div className="oracle-step-header">
                    <div className="oracle-step-badge">II</div>
                    <span className="oracle-step-label">
                      {copy.stonesLabel || 'Your stones'} · {r.label}
                    </span>
                  </div>

                  <div className="oracle-stones-trio">
                    {(r.stones || []).slice(0, 3).map((s, idx) => (
                      <div key={s.slug} className="oracle-stone-card">
                        <div className="stone-card-visual" style={s.image ? undefined : { background: s.colorHex }}>
                          {s.image && <img src={mediaUrl(s.image)} alt={s.name} className="stone-card-img" loading="lazy" />}
                          <div className="stone-specimen-badge">
                            <span>Specimen {idx + 1}</span>
                          </div>
                        </div>
                        <div className="stone-card-info">
                          <h4 className="stone-name">{s.name}</h4>
                          {s.powerUse && <p className="stone-desc">{s.powerUse}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.product && (
                    <Link to={`/p/${r.product.slug}`} className="oracle-featured-bracelet">
                      <div className="featured-bracelet-left">
                        <div className="featured-img-wrap">
                          {r.product.images?.[0] && <img src={mediaUrl(r.product.images[0])} alt={r.product.name} className="featured-thumb" />}
                        </div>
                        <div className="featured-info">
                          <div className="featured-badge-row">
                            <span className="modern-card-badge badge-bestseller">Ready-made</span>
                            {productRating > 0 && (
                              <div className="featured-stars">
                                <Star size={11} fill="#C5A572" color="#C5A572" />
                                <span className="featured-star-val">{productRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <h5 className="featured-title">{r.product.name}</h5>
                          <div className="featured-price-line">
                            <span className="featured-price">{formatInr(r.product.price)}</span>
                            <span className="featured-subtext">· {copy.readyLabel || 'Ready-made with these stones'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="featured-bracelet-action">
                        <span className="featured-acquire-btn">
                          <span>View</span>
                          <ArrowRight size={13} strokeWidth={2} />
                        </span>
                      </div>
                    </Link>
                  )}

                  <div className="oracle-cta-row">
                    <Link to={r.composeTo || '/customize'} className="oracle-compose-btn">
                      <Sparkles size={15} />
                      <span>{clean(copy.cta || 'Compose with these')}</span>
                      <ArrowRight size={15} strokeWidth={2} />
                    </Link>
                    <span className="oracle-cta-note">{copy.ctaNote || 'Loads these specimens directly onto your strand in the studio'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 7. craft (sacred origins) ---------------- */

const CRAFT_POINTS = [
  { title: 'High altitude', body: 'Harvested above 2,000 meters in the sanctified Himalayan foothills.' },
  { title: 'X-ray verified', body: 'Confirmed internal density and unbroken mukhi compartments.' },
  { title: '5 Mukhi Vedic', body: 'Ruled by Jupiter and aligned with universal peace and equanimity.' },
  { title: 'Consecrated', body: 'Sanctified with holy Ganga jal and infused with Vedic bija mantras.' },
];

export function ACraft({ copy = {}, image }) {
  const points = (copy.points?.length ? copy.points : CRAFT_POINTS).slice(0, 4);
  return (
    <section className="section-rudraksha">
      <div className="container-custom">
        <div className="rudraksha-editorial-grid">
          <div className="rudraksha-visual-plate reveal-left">
            <img src={image} alt="" className="rudraksha-main-img" loading="lazy" />
            <div className="rudraksha-origin-plaque">{copy.plaque || 'Nepal high-altitude origin · Grade A Vedic seed'}</div>
          </div>
          <div className="rudraksha-content reveal-right">
            {copy.eyebrow && <span className="section-eyebrow">{copy.eyebrow}</span>}
            <SectionTitle text={copy.title} className="section-title rudraksha-title" />
            {copy.body && <p className="rudraksha-text">{copy.body}</p>}
            <div className="rudraksha-attrs-grid">
              {points.map((c, i) => (
                <div key={`${c.title}-${i}`} className="rudraksha-attr-cell">
                  <span className="attr-label">{String(c.title).toUpperCase()}</span>
                  {c.body && <p className="attr-desc">{c.body}</p>}
                </div>
              ))}
            </div>
            <Link to={copy.to || '/rudraksha'} className="btn-outline rudraksha-cta">
              <span>{clean(copy.action || 'Explore the rudraksha house')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 8. reviews ---------------- */

export function AReviews({ copy = {}, voices = {}, testimonials = [], rating }) {
  const quotes = testimonials.filter((v) => v.quote && v.name).slice(0, 4);
  const showScore = copy.showSummary !== false && rating?.average && rating?.count;
  if (!quotes.length && !showScore) return null;
  const stars = (cls) => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cls}>
          ★
        </span>
      ))}
    </>
  );
  return (
    <section className="section-reviews">
      <div className="container-custom">
        <div className="reviews-editorial-layout">
          <div className="reviews-score-col reveal-left">
            <span className="section-eyebrow">{copy.eyebrow || voices.eyebrow}</span>
            {showScore && (
              <div className="reviews-number-wrap">
                <span className="reviews-number">{Number(rating.average).toFixed(1)}</span>
                <div className="reviews-stars-block">
                  <div className="reviews-stars-row">{stars('reviews-star')}</div>
                  <span className="reviews-verified-label">{formatReviewCount(rating.count)} reviews</span>
                </div>
              </div>
            )}
            <h3 className="reviews-heading">{copy.title || voices.title}</h3>
            {voices.body && <p className="reviews-text">{voices.body}</p>}
            {showScore && (
              <div className="reviews-verified-badge">
                <CheckCircle2 size={14} color="#C5A572" />
                <span>{copy.verifiedLabel || 'From customers who bought and wore it'}</span>
              </div>
            )}
          </div>

          <div className="reviews-cards-flow reveal-stagger">
            {quotes.map((v, idx) => (
              <div key={`${v.name}-${idx}`} className={`review-editorial-card ${idx % 2 === 1 ? 'review-stagger' : ''}`}>
                <div className="review-stars-line">{stars('review-star')}</div>
                <p className="review-quote">“{v.quote}”</p>
                <div className="review-citation">
                  <strong className="review-name">{v.name}</strong>
                  {v.place ? ` · ${v.place}` : ''}
                  {v.piece && <span className="review-product-tag">{v.piece}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 9. promises ---------------- */

const PROMISES = [
  { Icon: ShieldCheck, title: '100% Certified Natural', body: 'Every mineral verified authentic through rigorous gemological testing.' },
  { Icon: Sparkles, title: 'Hand-Strung in Rishikesh', body: 'Crafted by generational temple artisans on durable jewelers silk.' },
  { Icon: Award, title: 'Vedic Consecration', body: 'Sanctified with holy Ganga jal and planetary mantras prior to dispatch.' },
  { Icon: CheckCircle2, title: '7-Day Sacred Guarantee', body: 'Effortless millimeter size adjustment and complimentary restringing.' },
];

export function APromises({ claims = [] }) {
  const items = claims.length ? claims.slice(0, 4).map((c) => ({ ...c, Icon: claimIcon(c) })) : PROMISES;
  return (
    <section className="section-promises">
      <div className="container-custom">
        <div className="promises-monolith-grid reveal-stagger">
          {items.map(({ Icon, title, body }, idx) => (
            <div key={`${title}-${idx}`} className="promise-monolith-cell">
              <div className="promise-monolith-icon">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="promise-title">{title}</h4>
                {body && <p className="promise-desc">{body}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 10. newsletter ---------------- */

export function ANewsletter({ copy = {} }) {
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
  const [head, tail] = splitTitle(copy.title || 'Quiet notes from the atelier.');
  return (
    <section className="section-newsletter">
      <img src={img(copy.image, newsletterFallback)} alt="" className="newsletter-bg-img" loading="lazy" />
      <div className="newsletter-dark-overlay" />
      <div className="newsletter-content reveal-scale">
        <span className="section-eyebrow newsletter-eyebrow">{copy.eyebrow || 'The list'}</span>
        <h2 className="newsletter-headline">
          {head && (
            <>
              {head.toUpperCase()}
              <br />
            </>
          )}
          <span className="gold-italic">{tail}</span>
        </h2>
        <p className="newsletter-subtext">
          {copy.body || 'Subscribe for astrological transit advisories, lunar eclipse consecration updates, and exclusive access to uncirculated Himalayan gemstone drops.'}
        </p>
        {state.done ? (
          <div className="newsletter-success-box">
            <Check size={14} color="#C5A572" />
            <span>{copy.success || 'Thank you — you are on the list.'}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="newsletter-form">
            <label htmlFor="at-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="at-newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder={copy.placeholder || 'Your email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input"
            />
            <button type="submit" disabled={state.busy} className="btn-gold newsletter-btn">
              {state.busy ? copy.actionBusy || 'Joining…' : clean(copy.action) || 'Join'}
            </button>
          </form>
        )}
        {state.error && (
          <p className="newsletter-error" role="alert">
            {state.error}
          </p>
        )}
        <div className="newsletter-disclaimer">{copy.note || 'We transmit only purposeful astrological notices. Zero superfluous communications.'}</div>
      </div>
    </section>
  );
}
