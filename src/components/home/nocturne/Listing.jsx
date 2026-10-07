// Nocturne building blocks for listing pages (house and category pages).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
          <h1 className="nx-d nx-phero-t nx-rise">{title}</h1>
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
export function ProductListing({ products = [], chips = [], filterBy, empty, title = 'The pieces', eyebrow }) {
  const ref = useReveal();
  const [chip, setChip] = useState('all');
  const [sort, setSort] = useState('featured');
  const shown = useMemo(() => {
    const filtered = chip === 'all' || !filterBy ? products : products.filter((p) => filterBy(p, chip));
    return sortProducts(filtered, sort);
  }, [products, chip, sort, filterBy]);

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
              [{ value: 'all', label: 'All', count: products.length }, ...chips].map((c) => (
                <button key={c.value} type="button" role="tab" aria-selected={chip === c.value} className={chip === c.value ? 'is-on' : ''} onClick={() => setChip(c.value)}>
                  {c.label}
                  {c.count != null && <span>{c.count}</span>}
                </button>
              ))}
          </div>
          <div className="nx-toolbar-r">
            <span className="nx-count">
              {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}
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
      </div>
    </section>
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
