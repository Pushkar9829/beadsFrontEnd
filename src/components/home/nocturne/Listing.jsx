// Building blocks for listing pages (house, shop, category, collection, flash sale). The hero, pieces
// section and collection tiles follow beeds_ecommerce/src/pages/CategoryPage.jsx (styles/atelier/listing.css).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { HOUSE_IMAGES, NCard } from './Nocturne';
import { SectionTitle } from '../atelier/AtelierHome';

/** Category hero banner with breadcrumbs, eyebrow, title, copy and pill row. `size`: tall | short. */
export function PageHero({ image, crumbs = [], eyebrow, title, body, meta = [], actions, size = 'tall' }) {
  return (
    <section className={`cat-hero${size === 'short' ? ' is-short' : ''}`}>
      {image && <img src={image} alt="" className="cat-hero-img" fetchPriority="high" />}
      <div className="cat-hero-shade" />
      <div className="container-custom cat-hero-in">
        {crumbs.length > 0 && (
          <nav className="cat-crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h1 className={`cat-hero-title${String(title || '').length > 26 ? ' is-long' : ''}`}>{title}</h1>
        {body && <p className="cat-hero-desc">{body}</p>}
        {(meta.length > 0 || actions) && (
          <div className="cat-hero-pills">
            {meta.map((m) => (
              <span key={m} className="cat-hero-pill">
                {m}
              </span>
            ))}
            {actions && <span className="cat-hero-action">{actions}</span>}
          </div>
        )}
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
 * Cream "pieces" section: product grid with an optional pill filter (e.g. by sub-collection) and a sort menu.
 * chips: [{ value, label, count }] ; filterBy(product, value) → boolean. `children` render after the grid
 * inside the same section (e.g. inline CollectionTiles).
 */
export function ProductListing({ products = [], chips = [], filterBy, empty, title = 'The pieces', eyebrow, activeChip, onChip, extra, total, footer, children }) {
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
    <section className="category-pieces-section">
      <div className="container-custom">
        <div className="cat-pieces-head reveal-on-scroll">
          {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
          <h2 className="section-title">{String(title).toUpperCase()}</h2>
        </div>

        <div className="cat-filter-bar reveal-on-scroll">
          <div className="cat-filter-pills" role="tablist" aria-label="Filter">
            {chips.length > 1 &&
              [{ value: 'all', label: 'All', count: onChip ? undefined : products.length }, ...chips].map((c) => (
                <button key={c.value} type="button" role="tab" aria-selected={chip === c.value} className={`pill-tab ${chip === c.value ? 'active' : ''}`} onClick={() => setChip(c.value)}>
                  {c.label}
                  {c.count != null && <span className="pill-count">({c.count})</span>}
                </button>
              ))}
          </div>
          <div className="cat-sort-row">
            {extra}
            <span className="cat-count">
              {count} {count === 1 ? 'piece' : 'pieces'} shown
            </span>
            <label className="cat-select">
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
          <div className="cat-empty-wrap">{empty}</div>
        ) : (
          <div className="category-products-grid reveal-stagger">
            {shown.map((p) => (
              <NCard key={p._id} product={p} />
            ))}
          </div>
        )}
        {footer}
        {children}
      </div>
    </section>
  );
}

/** Prev / next pager for server-paginated lists. */
export function NPager({ page = 1, pages = 1, onPage }) {
  if (pages <= 1) return null;
  return (
    <nav className="cat-pager" aria-label="Pages">
      <button type="button" className="pill-tab" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ArrowLeft size={14} strokeWidth={1.6} /> Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button type="button" className="pill-tab" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ArrowRight size={14} strokeWidth={1.6} />
      </button>
    </nav>
  );
}

/** Skeleton grid while a listing loads (cream pieces section; `tone="dark"` for Nocturne pages). */
export function GridSkeleton({ n = 4, bare = false, tone = 'cream' }) {
  if (tone === 'dark') {
    const grid = (
      <div className="nx-grid">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="nx-skel" />
        ))}
      </div>
    );
    return bare ? grid : <div className="nx-w nx-sec">{grid}</div>;
  }
  const grid = (
    <div className="category-products-grid" aria-busy="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="cat-skel" />
      ))}
    </div>
  );
  return bare ? (
    grid
  ) : (
    <section className="category-pieces-section">
      <div className="container-custom">{grid}</div>
    </section>
  );
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

/** "Inside the house" tiles linking to sub-collections. items: [{ key, to, title, body, image, count, kicker }].
 * `inline` renders just the block (as ProductListing children); otherwise it gets its own cream section. */
export function CollectionTiles({ eyebrow, title, items = [], inline = false }) {
  if (!items.length) return null;
  const tiles = (
    <div className="cat-tiles reveal-on-scroll">
      <div className="cat-tiles-head">
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        {title && <SectionTitle text={title} />}
      </div>
      <div className="cat-tiles-grid reveal-stagger">
        {items.map((it, i) => {
          const studio = it.kicker === 'Studio';
          return (
            <Link key={it.key} to={it.to} className={`luxury-card cat-tile${studio ? ' is-studio' : ''}`}>
              {it.image ? <img src={it.image} alt="" loading="lazy" /> : <span className="cat-tile-tone" />}
              <div className="cat-tile-shade" />
              <div className="cat-tile-top">
                <span className="cat-tile-n">{studio ? 'STUDIO' : it.kicker || String(i + 1).padStart(2, '0')}</span>
                {it.count != null && it.count > 0 && (
                  <span className="cat-tile-count">
                    {it.count} {it.count === 1 ? 'piece' : 'pieces'}
                  </span>
                )}
              </div>
              <div className="cat-tile-body">
                <h3 className="cat-tile-h">{it.title}</h3>
                {it.body && <p className="cat-tile-p">{it.body}</p>}
                <div className="cat-tile-arrow" aria-hidden>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
  if (inline) return tiles;
  return (
    <section className="category-pieces-section is-tiles-only">
      <div className="container-custom">{tiles}</div>
    </section>
  );
}

/** Tiles for the three houses plus the studio (Homepage → Houses / Studio copy), for CollectionTiles. */
export function houseTiles(site) {
  const studio = site.studio || {};
  return [
    ...(site.houses?.items || []).map((h) => ({
      key: h.slug,
      to: `/${h.slug}`,
      title: h.name,
      body: h.blurb,
      image: h.image ? mediaUrl(h.image) : HOUSE_IMAGES[h.slug],
    })),
    { key: 'studio', to: studio.to || '/customize', title: studio.title || 'Customization', body: studio.body, kicker: 'Studio' },
  ];
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

/** Text-only page header (no photo) for utility pages: bag, checkout, account, policies, journal. */
export function PageIntro({ crumbs = [], eyebrow, title, body, actions, children, narrow = false, compact = false, split = false }) {
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
            {split ? <SectionTitle as="h1" text={title} className="nx-intro-t section-title nx-rise" /> : <h1 className="nx-d nx-intro-t nx-rise">{title}</h1>}
            {body && <p className="nx-intro-sub nx-rise">{body}</p>}
            {children}
          </div>
          {actions && <div className="nx-intro-a nx-rise">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
