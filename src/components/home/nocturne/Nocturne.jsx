// Nocturne home page sections. Copy comes from the CMS (home content), order/visibility from the
// admin Homepage layout, numbers from /api/home/summary. See docs/home-nocturne-spec.md.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, Plus } from 'lucide-react';
import api, { mediaUrl } from '../../../api/client';
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { claimIcon } from '../../../lib/claimIcons';
import { resolveProductRating, formatReviewCount } from '../../../lib/productRating';
import { formatInr } from '../../../lib/format';
import heroFallback from '../../../assets/home/hero-bracelet.jpg';
import crystalsImg from '../../../assets/home/house-crystals.jpg';
import rudrakshaImg from '../../../assets/home/house-rudraksha.jpg';
import gemstonesImg from '../../../assets/home/house-gemstones.jpg';
import studioImg from '../../../assets/home/finale-banner.jpg';

const HOUSE_IMAGES = { crystals: crystalsImg, rudraksha: rudrakshaImg, gemstones: gemstonesImg };
const pad = (n) => String(n).padStart(2, '0');
const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');
const img = (src, fallback = '') => (src ? mediaUrl(src) : fallback);

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

function useCountdown(endsAt) {
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
function Display({ text, as: Tag = 'h2', className = '' }) {
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
  return (
    <article className="nx-card">
      <div className="nx-card-ph">
        <Link to={`/p/${product.slug}`} aria-label={product.name} className="nx-card-link">
          {product.images?.[0] ? <img src={mediaUrl(product.images[0])} alt="" loading="lazy" /> : <span style={{ background: product.colorHex }} />}
        </Link>
        {tag && <span className={`nx-tag${tag === 'New' ? ' is-new' : ''}`}>{tag}</span>}
        <button type="button" className={`nx-heart${wishlisted ? ' is-on' : ''}`} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name}`} onClick={() => toggleWish(product)}>
          <Heart size={14} strokeWidth={1.5} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="nx-qa" onClick={() => addProduct(product, 1)}>
          Quick add <Plus size={13} />
        </button>
      </div>
      <Link to={`/p/${product.slug}`} className="nx-card-m">
        <span>
          <span className="nx-card-n">{product.name}</span>
          {product.shortDescription && <span className="nx-card-s">{product.shortDescription}</span>}
          {rating > 0 && reviewCount > 0 && (
            <span className="nx-card-r">
              <b>★</b> {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)} · {formatReviewCount(reviewCount)} reviews
            </span>
          )}
        </span>
        <span className="nx-card-p">
          {formatInr(product.price)}
          {off > 0 && <s>{formatInr(was)}</s>}
        </span>
      </Link>
    </article>
  );
}

/* ---------------- 1. hero ---------------- */

export function NHero({ hero = {}, products = {}, sale, flashCopy = {} }) {
  const slides = useMemo(() => [hero, ...((hero.slides || []).filter((s) => s && (s.image || s.title)))], [hero]);
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(id);
  }, [count]);
  const slide = { ...hero, ...slides[index % count] };
  const spot = slide.hotspot || {};
  const spotProduct = spot.productSlug ? products[spot.productSlug] : null;
  const primary = slide.primaryCta || {};
  const secondary = slide.secondaryCta || {};
  const t = useCountdown(sale?.endsAt);
  return (
    <section className="nx-hero">
      {slides.map((s, i) => (
        <img key={i} className={`nx-hero-img${i === index % count ? ' is-on' : ''}`} src={img(s.image, heroFallback)} alt={i === index % count ? slide.imageAlt || '' : ''} fetchPriority={i === 0 ? 'high' : 'low'} />
      ))}
      <div className="nx-hero-shade" />
      {sale && t && !t.done && (
        <Link to={flashCopy.to || '/sale'} className="nx-ann">
          <b>{sale.name}</b> · timed atelier prices end in <span>{t.d}d {pad(t.h)}h {pad(t.m)}m</span> · <u>{clean(flashCopy.action || 'Shop the sale')}</u>
        </Link>
      )}
      {spotProduct && (
        <Link to={`/p/${spotProduct.slug}`} className="nx-spot" style={{ left: `${spot.x ?? 31}%`, top: `${spot.y ?? 45}%` }}>
          <i aria-hidden />
          <span className="nx-spot-card">
            {spotProduct.images?.[0] && <img src={mediaUrl(spotProduct.images[0])} alt="" />}
            <span>
              <b>{spotProduct.name}</b>
              <span>
                {spotProduct.shortDescription ? `${spotProduct.shortDescription} · ` : ''}
                {formatInr(spotProduct.price)} →
              </span>
            </span>
          </span>
        </Link>
      )}
      <div className="nx-hero-c">
        <div className="nx-w nx-hero-row">
          <div className="nx-hero-blk" key={index}>
            {slide.eyebrow && <p className="nx-eb nx-rise">{slide.eyebrow}</p>}
            <Display
              as="h1"
              text={slide.title || hero.brandName || 'Kuberstones'}
              className={`nx-hero-t nx-rise${String(slide.title || '').length > 22 ? ' is-long' : ''}`}
            />
            {slide.subtitle && <p className="nx-hero-sub nx-rise">{slide.subtitle}</p>}
            <div className="nx-hero-cta nx-rise">
              {primary.label && (
                <Link to={primary.to || '/customize'} className="nx-btn">
                  {clean(primary.label)} <ArrowRight size={15} strokeWidth={1.6} />
                </Link>
              )}
              {secondary.label && (
                <Link to={secondary.to || '/shop'} className="nx-btn nx-btn-o">
                  {clean(secondary.label)}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {count > 1 && (
        <div className="nx-slides">
          <b>{pad((index % count) + 1)}</b>
          <span className="nx-slides-bar">
            <i style={{ width: `${(((index % count) + 1) / count) * 100}%` }} />
          </span>
          <span>{pad(count)}</span>
          <button type="button" aria-label="Previous slide" onClick={() => setIndex((i) => (i - 1 + count) % count)}>
            <ArrowLeft size={15} />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => setIndex((i) => (i + 1) % count)}>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      <span className="nx-scroll" aria-hidden>
        Scroll
      </span>
    </section>
  );
}

/* ---------------- 2. facts ---------------- */

export function NFacts({ items = [], vars = {} }) {
  const rows = items
    .map((it) => ({ value: fillFacts(it.value, vars), label: fillFacts(it.label, vars) }))
    .filter((it) => it.value && it.label !== null);
  if (!rows.length) return null;
  return (
    <div className="nx-facts">
      <div className="nx-w nx-facts-row" style={{ '--n': rows.length }}>
        {rows.map((r, i) => (
          <div key={i}>
            <b>{r.value}</b>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 3. houses + studio ---------------- */

export function NHouses({ houses = {}, studio = {}, ritual = {}, counts = {}, minPrice }) {
  const ref = useReveal();
  const items = (houses.items || []).slice(0, 3);
  if (!items.length) return null;
  const [big, ...rest] = items;
  const tile = (h, i, cls) => (
    <Link key={h.slug || i} to={`/${h.slug}`} className={`nx-tile ${cls}`}>
      <img src={img(h.image, HOUSE_IMAGES[h.slug])} alt="" loading="lazy" />
      <span className="nx-tile-top">
        <span>House {h.roman || i + 1}</span>
        {counts[h.slug] > 0 && <span className="nx-pill">{counts[h.slug]} {counts[h.slug] === 1 ? 'piece' : 'pieces'}</span>}
      </span>
      <span className="nx-tile-t">
        <span>
          <span className="nx-d nx-tile-h">{h.name}</span>
          {cls === 'is-big' && h.blurb && <span className="nx-tile-p">{h.blurb}</span>}
        </span>
        <span className="nx-arrow" aria-hidden>
          <ArrowRight size={16} strokeWidth={1.5} />
        </span>
      </span>
    </Link>
  );
  const steps = (ritual.steps || []).slice(0, 4);
  return (
    <section ref={ref} className="nx-sec nx-reveal">
      <div className="nx-w">
        <Head eyebrow={houses.eyebrow} title={houses.title}>
          <Link to="/shop" className="nx-lnk">
            Shop everything →
          </Link>
        </Head>
        <div className="nx-bento">
          {tile(big, 0, 'is-big')}
          {rest.map((h, i) => tile(h, i + 1, ''))}
          <div className="nx-tile is-studio">
            <div className="nx-studio-tx">
              {studio.eyebrow && <p className="nx-eb">{studio.eyebrow}</p>}
              <Display text={studio.heading || studio.title || 'Compose your own.'} className="nx-tile-h nx-studio-h" />
              {steps.length > 0 && (
                <ol className="nx-chips">
                  {steps.map((s, i) => (
                    <li key={s.title || i}>
                      <b>{i + 1}</b>
                      {s.title}
                    </li>
                  ))}
                </ol>
              )}
              <div className="nx-studio-cta">
                <Link to={studio.to || '/customize'} className="nx-btn">
                  {clean(studio.cta || studio.action || 'Open the studio')} <ArrowRight size={15} strokeWidth={1.6} />
                </Link>
                {minPrice > 0 && <span>From {formatInr(minPrice)}</span>}
              </div>
            </div>
            <div className="nx-studio-ph">
              <img src={img(studio.bannerImage, studioImg)} alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4. collection carousel ---------------- */

export function NCollection({ copy = {}, tabs = [] }) {
  const ref = useReveal();
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState({ at: 0, shown: 0 });
  const rail = useRef(null);
  const list = tabs.filter((t) => t.products?.length);
  const tab = list[Math.min(active, Math.max(0, list.length - 1))];
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress({ at: max > 0 ? el.scrollLeft / max : 1, shown: Math.min(1, el.clientWidth / el.scrollWidth) });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, tab?.key]);
  if (!tab) return null;
  const scrollBy = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' });
  const width = Math.max(0.12, progress.shown);
  return (
    <section ref={ref} className="nx-sec nx-reveal nx-pt0">
      <div className="nx-w">
        <Head eyebrow={copy.eyebrow} title={copy.title} body={copy.body}>
          <div className="nx-coll-ctl">
            {list.length > 1 && (
              <div className="nx-seg" role="tablist" aria-label="Collections">
                {list.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={t === tab}
                    className={t === tab ? 'is-on' : ''}
                    onClick={() => {
                      setActive(i);
                      rail.current?.scrollTo({ left: 0 });
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <div className="nx-arrows">
              <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)}>
                <ArrowLeft size={16} />
              </button>
              <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </Head>
        <div ref={rail} className="nx-rail" onScroll={measure} key={tab.key}>
          {tab.products.slice(0, 12).map((p) => (
            <div key={p._id} className="nx-rail-item">
              <NCard product={p} />
            </div>
          ))}
        </div>
        <div className="nx-prog">
          <span>
            {pad(Math.min(tab.products.length, 12))} pieces
          </span>
          <span className="nx-prog-bar">
            <i style={{ width: `${width * 100}%`, left: `${progress.at * (1 - width) * 100}%` }} />
          </span>
          {tab.to && (
            <Link to={tab.to} className="nx-lnk">
              {clean(tab.action) || `View all ${tab.label.toLowerCase()}`} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5. flash sale ---------------- */

export function NFlash({ sale, products = [], copy = {} }) {
  const ref = useReveal();
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  const units = t.d > 0 ? [[t.d, 'Days'], [t.h, 'Hours'], [t.m, 'Minutes']] : [[t.h, 'Hours'], [t.m, 'Minutes'], [t.s, 'Seconds']];
  return (
    <section ref={ref} className="nx-sec nx-flash nx-reveal">
      <div className="nx-w nx-flash-row">
        <div>
          <p className="nx-eb nx-violet">✦ {copy.label || 'Flash sale'} · {sale.name}</p>
          <Display text={copy.title || 'A short list, briefly.'} className="nx-h2" />
          <div className="nx-clock" aria-label={`Ends in ${t.d} days ${t.h} hours ${t.m} minutes`}>
            {units.map(([v, l], i) => (
              <span key={l} className={i === 0 ? 'is-solid' : ''}>
                <b>{pad(v)}</b>
                <small>{l}</small>
              </span>
            ))}
          </div>
          {copy.body && <p className="nx-lede">{copy.body}</p>}
          <Link to={copy.to || '/sale'} className="nx-btn nx-btn-c nx-mt">
            {clean(copy.action || 'Shop the sale')} <ArrowRight size={15} strokeWidth={1.6} />
          </Link>
        </div>
        {products.length > 0 && (
          <div className={`nx-flash-grid is-${Math.min(2, products.length)}`}>
            {products.slice(0, 2).map((p) => (
              <NCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
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

/* ---------------- 7. stone finder ---------------- */

export function NFinder({ copy = {}, purposes = [] }) {
  const ref = useReveal();
  const options = purposes.slice(0, Number(copy.purposeLimit) || 6);
  const [purpose, setPurpose] = useState(null);
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [state, setState] = useState({ loading: false, data: null, error: '' });
  const ask = useCallback(async (params) => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await api.get('/customizer/finder', { params });
      setState({ loading: false, data, error: '' });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message || 'Could not find stones right now.' });
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
  const r = state.data;
  return (
    <section ref={ref} className="nx-sec nx-alt nx-reveal">
      <div className="nx-w">
        <div className="nx-finder">
          <div className="nx-finder-l">
            <p className="nx-eb">{copy.eyebrow}</p>
            <Display text={copy.title} className="nx-h2 nx-h2-s" />
            {copy.body && <p className="nx-lede">{copy.body}</p>}
            <p className="nx-step">
              <b>1</b>What are you asking for?
            </p>
            <div className="nx-opts">
              {options.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  className={purpose === p.slug ? 'is-on' : ''}
                  aria-pressed={purpose === p.slug}
                  onClick={() => {
                    setPurpose(p.slug);
                    ask({ purpose: p.slug });
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="nx-or">or by birth date</p>
            <form className="nx-dob" onSubmit={onDob}>
              <input inputMode="numeric" maxLength={2} placeholder="DD" aria-label="Day" value={dob.d} onChange={(e) => setDob({ ...dob, d: e.target.value.replace(/\D/g, '') })} />
              <input inputMode="numeric" maxLength={2} placeholder="MM" aria-label="Month" value={dob.m} onChange={(e) => setDob({ ...dob, m: e.target.value.replace(/\D/g, '') })} />
              <input inputMode="numeric" maxLength={4} placeholder="YYYY" aria-label="Year" value={dob.y} onChange={(e) => setDob({ ...dob, y: e.target.value.replace(/\D/g, '') })} />
              <button type="submit" disabled={!dobValid} aria-label="Find stones for this birth date">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
          <div className={`nx-finder-r${state.loading ? ' is-loading' : ''}`} aria-live="polite">
            {state.error && <p className="nx-lede">{state.error}</p>}
            {r && (
              <>
                <p className="nx-step nx-step-0">
                  <b>2</b>Your stones · {r.label}
                </p>
                <div className="nx-res">
                  {(r.stones || []).map((s) => (
                    <div key={s.slug}>
                      <span className="nx-orb" style={{ background: s.colorHex }}>
                        {s.image && <img src={mediaUrl(s.image)} alt="" />}
                      </span>
                      <b>{s.name}</b>
                      {s.powerUse && <span>{s.powerUse}</span>}
                    </div>
                  ))}
                </div>
                {r.product && (
                  <Link to={`/p/${r.product.slug}`} className="nx-match">
                    {r.product.images?.[0] && <img src={mediaUrl(r.product.images[0])} alt="" />}
                    <span>
                      <b>{r.product.name}</b>
                      <span>Ready-made with these stones · {formatInr(r.product.price)}</span>
                    </span>
                    <span className="nx-lnk">View →</span>
                  </Link>
                )}
                <div className="nx-finder-cta">
                  <Link to={r.composeTo || '/customize'} className="nx-btn nx-btn-c">
                    {clean(copy.cta || 'Compose with these')} <ArrowRight size={15} strokeWidth={1.6} />
                  </Link>
                </div>
              </>
            )}
          </div>
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

/* ---------------- 9. craft ---------------- */

export function NCraft({ copy = {}, claims = [], image }) {
  const ref = useReveal();
  const items = claims.slice(0, 4);
  return (
    <section ref={ref} className="nx-craft nx-reveal">
      <div className="nx-craft-ph">
        <img src={image} alt="" loading="lazy" />
      </div>
      <div className="nx-craft-tx">
        <p className="nx-eb">{copy.eyebrow}</p>
        <Display text={copy.title} className="nx-h2" />
        {copy.body && <p className="nx-lede">{copy.body}</p>}
        {items.length > 0 && (
          <ul className="nx-craft-grid">
            {items.map((c, i) => {
              const Icon = claimIcon(c);
              return (
                <li key={`${c.title}-${i}`}>
                  <span className="nx-craft-n">
                    <Icon size={16} strokeWidth={1.4} /> {pad(i + 1)}
                  </span>
                  <span className="nx-craft-h">{c.title}</span>
                  {c.body && <span className="nx-craft-p">{c.body}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------------- 10. reviews ---------------- */

function isImage(src = '') {
  return src && !/youtu|vimeo|\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

export function NReviews({ copy = {}, voices = {}, testimonials = [], faqs = [], faqCopy = {}, rating }) {
  const ref = useReveal();
  const quotes = testimonials.filter((v) => v.quote && v.name).slice(0, 3);
  const showScore = copy.showSummary !== false && rating?.average && rating?.count;
  if (!quotes.length && !showScore) return null;
  return (
    <section ref={ref} className="nx-sec nx-reveal">
      <div className="nx-w nx-reviews">
        <div className="nx-score">
          <p className="nx-eb">{copy.eyebrow || voices.eyebrow}</p>
          {showScore ? (
            <>
              <b>{Number(rating.average).toFixed(1)}</b>
              <span className="nx-stars" aria-hidden>
                ★★★★★
              </span>
              <span className="nx-score-c">Average from {formatReviewCount(rating.count)} reviews</span>
            </>
          ) : (
            <Display text={copy.title || voices.title} className="nx-h2" />
          )}
        </div>
        <div className="nx-quotes">
          {quotes.map((v, i) => (
            <figure key={`${v.name}-${i}`} className="nx-q">
              <span className="nx-stars" aria-hidden>
                ★★★★★
              </span>
              <blockquote>“{v.quote}”</blockquote>
              <figcaption>
                {isImage(v.media) && <img src={mediaUrl(v.media)} alt="" />}
                <span>
                  <b>
                    {v.name}
                    {v.place ? ` · ${v.place}` : ''}
                  </b>
                  {v.piece && <span>{v.piece}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
          {faqs.length > 0 && (
            <div className="nx-q nx-faqcard">
              <p className="nx-eb">{copy.faqTitle || 'Before you buy'}</p>
              <ul>
                {faqs.slice(0, 4).map((f) => (
                  <li key={f._id}>
                    <Link to={`${faqCopy.to || '/faq'}#${f._id}`}>
                      {f.question} <ArrowRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={faqCopy.to || '/faq'} className="nx-lnk">
                {clean(faqCopy.action || 'All questions')} →
              </Link>
            </div>
          )}
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

/* ---------------- 12. newsletter ---------------- */

export function NNewsletter({ copy = {} }) {
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
    <section className="nx-letter">
      <div className="nx-w nx-letter-row">
        <div>
          <p className="nx-eb">{copy.eyebrow || 'The list'}</p>
          <Display text={copy.title || 'Quiet notes from the atelier.'} className="nx-h2 nx-h2-s" />
        </div>
        <div>
          {state.done ? (
            <p className="nx-lede">Thank you — you are on the list.</p>
          ) : (
            <form className="nx-letter-form" onSubmit={submit}>
              <label htmlFor="nx-email" className="sr-only">
                Email address
              </label>
              <input id="nx-email" type="email" required autoComplete="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={state.busy}>
                {state.busy ? 'Joining…' : 'Join →'}
              </button>
            </form>
          )}
          {state.error && (
            <p className="nx-err" role="alert">
              {state.error}
            </p>
          )}
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

/* ---------------- footer (home only; same CMS footer content) ---------------- */

export function NFooter({ footer = {}, brandName = 'KUBERSTONES' }) {
  const groups = [
    ['Shop', footer.shopLinks || []],
    ['Help', footer.careLinks || []],
    ['House', footer.legalLinks || []],
  ].filter(([, links]) => links.length);
  return (
    <footer className="nx-footer">
      <div className="nx-w">
        <div className="nx-footer-cols">
          <div>
            <Link to="/" className="nx-logo">
              {String(footer.brandName || brandName).toUpperCase()}
            </Link>
            {footer.blurb && <p className="nx-footer-blurb">{footer.blurb}</p>}
            <div className="nx-pay" aria-label="Secure payments">
              <span>UPI</span>
              <span>Cards</span>
              <span>Netbanking</span>
            </div>
          </div>
          {groups.map(([title, links]) => (
            <div key={title}>
              <p className="nx-footer-h">{title}</p>
              <ul>
                {links.map((l) => (
                  <li key={`${l.to}-${l.label}`}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="nx-footer-legal">
          <span>
            © {new Date().getFullYear()} {footer.brandName || 'Kuberstones'}
            {footer.instagram && (
              <a href={footer.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
          </span>
          <span>{footer.tagline || 'Crystal associations are traditional, not medical claims.'}</span>
        </div>
      </div>
    </footer>
  );
}
