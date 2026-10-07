// Nocturne building blocks for listing pages (house and category pages).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { NCard, useReveal } from './Nocturne';

/** Full-bleed page hero with breadcrumbs. Height is set per page via `size` (tall | short). */
export function PageHero({ image, crumbs = [], eyebrow, title, body, meta = [], actions, size = 'tall' }) {
  return (
    <section className={`nx-phero is-${size}`}>
      {image && <img src={image} alt="" fetchPriority="high" />}
      <div className="nx-phero-shade" />
      <div className="nx-w nx-phero-in">
        {crumbs.length > 0 && (
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="nx-phero-copy">
          {eyebrow && <p className="nx-eb nx-rise">{eyebrow}</p>}
          <h1 className={`nx-d nx-phero-t nx-rise${String(title || '').length > 26 ? ' is-long' : ''}`}>{title}</h1>
          {body && <p className="nx-phero-sub nx-rise">{body}</p>}
          {(meta.length > 0 || actions) && (
            <div className="nx-phero-row nx-rise">
              {meta.length > 0 && (
                <ul className="nx-phero-meta">
                  {meta.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

function sortProducts(list, sort) {
  const out = [...list];
  if (sort === 'price-asc') out.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') out.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') out.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
  else if (sort === 'new') out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else out.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.featuredSort || 0) - (b.featuredSort || 0));
  return out;
}

/**
 * Product grid with an optional chip filter (e.g. by sub-collection) and a sort menu.
 * chips: [{ value, label, count }] ; filterBy(product, value) → boolean
 */
export function ProductListing({ products = [], chips = [], filterBy, empty, title = 'The pieces', eyebrow, activeChip, onChip, extra, total, footer }) {
  const ref = useReveal();
  const [ownChip, setOwnChip] = useState('all');
  // Controlled chips (onChip) filter on the server; otherwise filter the list we were given.
  const chip = onChip ? activeChip || 'all' : ownChip;
  const setChip = onChip || setOwnChip;
  const [sort, setSort] = useState('featured');
  const shown = useMemo(() => {
    const filtered = onChip || chip === 'all' || !filterBy ? products : products.filter((p) => filterBy(p, chip));
    return sortProducts(filtered, sort);
  }, [products, chip, sort, filterBy, onChip]);
  const count = total ?? shown.length;

  return (
    <section ref={ref} className="nx-sec nx-reveal">
      <div className="nx-w">
        <div className="nx-head nx-head-tight">
          <div>
            {eyebrow && <p className="nx-eb">{eyebrow}</p>}
            <h2 className="nx-d nx-h2 nx-h2-s">{title}</h2>
          </div>
        </div>
        <div className="nx-toolbar">
          <div className="nx-chips-row" role="tablist" aria-label="Filter">
            {chips.length > 1 &&
              [{ value: 'all', label: 'All', count: onChip ? undefined : products.length }, ...chips].map((c) => (
                <button key={c.value} type="button" role="tab" aria-selected={chip === c.value} className={chip === c.value ? 'is-on' : ''} onClick={() => setChip(c.value)}>
                  {c.label}
                  {c.count != null && <span>{c.count}</span>}
                </button>
              ))}
          </div>
          <div className="nx-toolbar-r">
            {extra}
            <span className="nx-count">
              {count} {count === 1 ? 'piece' : 'pieces'}
            </span>
            <label className="nx-sort">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden />
            </label>
          </div>
        </div>
        {shown.length === 0 ? (
          empty
        ) : (
          <div className="nx-grid">
            {shown.map((p, i) => (
              <div key={p._id} className="nx-grid-item" style={{ '--i': Math.min(i, 12) }}>
                <NCard product={p} />
              </div>
            ))}
          </div>
        )}
        {footer}
      </div>
    </section>
  );
}

/** Prev / next pager for server-paginated lists. */
export function NPager({ page = 1, pages = 1, onPage }) {
  if (pages <= 1) return null;
  return (
    <nav className="nx-pager" aria-label="Pages">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ArrowLeft size={14} strokeWidth={1.6} /> Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ArrowRight size={14} strokeWidth={1.6} />
      </button>
    </nav>
  );
}

/** Skeleton grid while a listing loads. */
export function GridSkeleton({ n = 4, bare = false }) {
  const grid = (
    <div className="nx-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="nx-skel" />
      ))}
    </div>
  );
  return bare ? grid : <div className="nx-w nx-sec">{grid}</div>;
}

const cleanLabel = (s) => String(s || '').replace(/\s*→\s*$/, '');

/** CMS empty / missing block ({ title, copy, primaryCta, secondaryCta }) as a Nocturne empty state. */
export function CmsEmpty({ block }) {
  if (!block?.title) return null;
  return (
    <EmptyBlock
      title={block.title}
      body={block.copy}
      actions={
        <>
          {block.primaryCta?.label && (
            <Link to={block.primaryCta.to || '/'} className="nx-btn">
              {cleanLabel(block.primaryCta.label)}
            </Link>
          )}
          {block.secondaryCta?.label && (
            <Link to={block.secondaryCta.to || '/'} className="nx-btn nx-btn-o">
              {cleanLabel(block.secondaryCta.label)}
            </Link>
          )}
        </>
      }
    />
  );
}

/** Large photo tiles linking to sub-collections. items: [{ key, to, title, body, image, count, kicker }] */
export function CollectionTiles({ eyebrow, title, items = [] }) {
  const ref = useReveal();
  if (!items.length) return null;
  return (
    <section ref={ref} className="nx-sec nx-reveal nx-pb0">
      <div className="nx-w">
        <div className="nx-head nx-head-tight">
          <div>
            {eyebrow && <p className="nx-eb">{eyebrow}</p>}
            {title && <h2 className="nx-d nx-h2 nx-h2-s">{title}</h2>}
          </div>
        </div>
        <div className={`nx-subs is-${Math.min(items.length, 4)}`}>
          {items.map((it, i) => (
            <Link key={it.key} to={it.to} className="nx-sub">
              {it.image ? <img src={it.image} alt="" loading="lazy" /> : <span className="nx-pt-tone" />}
              <span className="nx-sub-top">
                <span>{it.kicker || String(i + 1).padStart(2, '0')}</span>
                {it.count != null && it.count > 0 && <span className="nx-pill">{it.count} {it.count === 1 ? 'piece' : 'pieces'}</span>}
              </span>
              <span className="nx-sub-c">
                <span className="nx-d nx-sub-h">{it.title}</span>
                {it.body && <span className="nx-sub-p">{it.body}</span>}
              </span>
              <span className="nx-arrow nx-sub-arrow" aria-hidden>
                <ArrowRight size={16} strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Quiet empty / not-found block. */
export function EmptyBlock({ title, body, actions }) {
  return (
    <div className="nx-empty">
      <p className="nx-d nx-empty-t">{title}</p>
      {body && <p className="nx-lede">{body}</p>}
      {actions && <div className="nx-empty-a">{actions}</div>}
    </div>
  );
}

/** Small editorial banners (admin "category" placement). */
export function BannerRow({ banners = [] }) {
  if (!banners.length) return null;
  return (
    <div className="nx-w">
      <div className={`nx-banners is-${Math.min(2, banners.length)}`}>
        {banners.slice(0, 2).map((b) => (
          <Link key={b._id} to={b.link || '#'} className="nx-banner">
            <img src={mediaUrl(b.image)} alt="" loading="lazy" />
            {b.title && <span>{b.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Compact "studio" invitation used at the end of listing pages. */
export function StudioBand({ title = 'Compose your own strand.', body, to = '/customize', cta = 'Open the studio' }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="nx-band nx-reveal">
      <div className="nx-w nx-band-row">
        <div>
          <p className="nx-eb">The studio</p>
          <p className="nx-d nx-band-t">{title}</p>
          {body && <p className="nx-lede">{body}</p>}
        </div>
        <Link to={to} className="nx-btn">
          {cta} <ArrowRight size={15} strokeWidth={1.6} />
        </Link>
      </div>
    </section>
  );
}

/** Text-only page header (no photo) for utility pages: bag, checkout, account, policies, journal. */
export function PageIntro({ crumbs = [], eyebrow, title, body, actions, children, narrow = false, compact = false }) {
  return (
    <div className={`nx-intro${narrow ? ' is-narrow' : ''}${compact ? ' is-compact' : ''}`}>
      <div className="nx-w">
        {crumbs.length > 0 && (
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        )}
        <div className="nx-intro-row">
          <div className="nx-intro-copy">
            {eyebrow && <p className="nx-eb nx-rise">{eyebrow}</p>}
            <h1 className="nx-d nx-intro-t nx-rise">{title}</h1>
            {body && <p className="nx-intro-sub nx-rise">{body}</p>}
            {children}
          </div>
          {actions && <div className="nx-intro-a nx-rise">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
