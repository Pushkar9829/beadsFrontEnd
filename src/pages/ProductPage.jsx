import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus } from 'lucide-react';
import api, { mediaUrl } from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { houseMeta } from '../lib/homeContent';
import { resolveProductRating, formatReviewCount } from '../lib/productRating';
import { formatInr } from '../lib/format';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES, NCard, useCountdown, useReveal } from '../components/home/nocturne/Nocturne';
import { CmsEmpty, PageHero, StudioBand } from '../components/home/nocturne/Listing';

const pad = (n) => String(n).padStart(2, '0');

function SaleTimer({ sale }) {
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  return (
    <p className="nx-pd-sale">
      <b>{sale.name || 'Flash sale'}</b> · ends in {t.d}d {pad(t.h)}h {pad(t.m)}m
    </p>
  );
}

function Related({ product }) {
  const ref = useReveal();
  const [items, setItems] = useState([]);
  useEffect(() => {
    let alive = true;
    const category = product.categoryId?.slug;
    const pick = (list) => list.filter((p) => p._id !== product._id).slice(0, 4);
    api
      .get('/products', { params: category ? { category } : { family: product.family } })
      .then(async ({ data }) => {
        let list = pick(data.products || []);
        // Too few in the category: top up from the rest of the house.
        if (list.length < 4 && category) {
          const more = await api.get('/products', { params: { family: product.family } }).catch(() => null);
          const seen = new Set(list.map((p) => p._id));
          list = [...list, ...pick(more?.data.products || []).filter((p) => !seen.has(p._id))].slice(0, 4);
        }
        if (alive) setItems(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [product._id, product.family, product.categoryId?.slug]);

  if (!items.length) return null;
  return (
    <section ref={ref} className="nx-sec nx-reveal nx-pb0">
      <div className="nx-w">
        <div className="nx-head nx-head-tight">
          <div>
            <p className="nx-eb">Worn alongside</p>
            <h2 className="nx-d nx-h2 nx-h2-s">You may also like</h2>
          </div>
          {product.categoryId?.slug && (
            <Link to={`/c/${product.categoryId.slug}`} className="nx-lnk">
              All {product.categoryId.name?.toLowerCase()} →
            </Link>
          )}
        </div>
        <div className="nx-grid">
          {items.map((p) => (
            <NCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductPage() {
  const site = useSite();
  const brand = useBrand();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => (product ? s.has(product._id) : false));
  const toggleWish = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setAdded(false);
    setQty(1);
    setShot(0);
    api
      .get(`/products/${slug}`)
      .then(({ data }) => alive && setProduct(data.product))
      .catch(() => alive && setProduct(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="nx nx-page">
        <div className="nx-w nx-pd">
          <div className="nx-pd-grid">
            <div className="nx-skel nx-pd-skel" />
            <div />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    const missing = site.pages.product.missing;
    return (
      <div className="nx nx-page">
        <PageHero size="short" image={HOUSE_IMAGES.gemstones} crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} eyebrow={missing?.kicker} title={missing?.title || 'Piece not found.'} body={missing?.copy} />
        <div className="nx-w nx-sec">
          <CmsEmpty block={{ ...missing, title: 'Keep exploring.', copy: '' }} />
        </div>
      </div>
    );
  }

  const house = houseMeta(site, product.family);
  const images = product.images?.length ? product.images : [];
  const was = product.originalPrice || product.compareAtPrice;
  const off = was > product.price ? Math.round((1 - product.price / was) * 100) : 0;
  const { rating, reviewCount } = resolveProductRating(product);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= (product.lowStockLimit ?? 5);
  const maxQty = Math.max(1, Math.min(10, product.stock || 1));
  const attributes = Object.entries(product.attributes || {});
  const crumbs = [
    { label: 'Home', to: '/' },
    house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop all', to: '/shop' },
    product.categoryId?.slug && { label: product.categoryId.name, to: `/c/${product.categoryId.slug}` },
    { label: product.name },
  ].filter(Boolean);

  async function add() {
    if (soldOut) return;
    await addProduct(product, qty);
    setAdded(true);
  }

  return (
    <div className="nx nx-page nx-pd-page">
      <SeoHead
        title={product.seo?.title || pageTitle(product.name, brand)}
        description={product.seo?.description || product.shortDescription}
        keywords={product.seo?.keywords}
        image={product.seo?.ogImage || product.images?.[0]}
        noIndex={product.seo?.noIndex}
      />
      <div className="nx-w nx-pd">
        <nav className="nx-crumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
            ))}
          </ol>
        </nav>

        <div className="nx-pd-grid">
          {/* gallery */}
          <div className="nx-pd-gallery">
            <div className="nx-pd-main">
              {images.length ? <img key={shot} src={mediaUrl(images[shot])} alt={product.name} fetchPriority="high" /> : <span style={{ background: product.colorHex || 'var(--nx-tile)' }} />}
              {off > 0 && <span className="nx-tag">{product.flashSale ? `Flash −${off}%` : `−${off}%`}</span>}
            </div>
            {images.length > 1 && (
              <div className="nx-pd-thumbs">
                {images.map((src, i) => (
                  <button key={src} type="button" className={i === shot ? 'is-on' : ''} aria-label={`Image ${i + 1}`} onClick={() => setShot(i)}>
                    <img src={mediaUrl(src)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* details */}
          <div className="nx-pd-info">
            <p className="nx-eb">
              {house?.name || product.family}
              {product.categoryId?.name ? ` · ${product.categoryId.name}` : ''}
            </p>
            <h1 className="nx-d nx-pd-t">{product.name}</h1>
            {product.shortDescription && <p className="nx-pd-stones">{product.shortDescription}</p>}
            {rating > 0 && reviewCount > 0 && (
              <p className="nx-pd-rate">
                <b>★ {rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</b> · {formatReviewCount(reviewCount)} reviews
              </p>
            )}

            <div className="nx-pd-price">
              <span>{formatInr(product.price)}</span>
              {off > 0 && (
                <>
                  <s>{formatInr(was)}</s>
                  <em>Save {off}%</em>
                </>
              )}
            </div>
            <SaleTimer sale={product.flashSale} />

            <div className="nx-pd-buy">
              <div className="nx-qty" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={qty <= 1 || soldOut} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty || soldOut} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
                  <Plus size={14} />
                </button>
              </div>
              <button type="button" className="nx-btn nx-pd-add" disabled={soldOut} onClick={add}>
                {soldOut ? 'Sold out' : `Add to bag · ${formatInr(product.price * qty)}`}
              </button>
              <button type="button" className={`nx-pd-wish${wishlisted ? ' is-on' : ''}`} aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => toggleWish(product)}>
                <Heart size={18} strokeWidth={1.4} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
            {added && (
              <p className="nx-pd-added" role="status">
                <Check size={14} /> Added to bag. <Link to="/cart">View bag →</Link>
              </p>
            )}
            {lowStock && <p className="nx-pd-stock">Only {product.stock} left.</p>}

            <div className="nx-pd-acc">
              {product.description && (
                <details open>
                  <summary>The piece</summary>
                  <p>{product.description}</p>
                </details>
              )}
              {(attributes.length > 0 || product.sku) && (
                <details>
                  <summary>Details</summary>
                  <dl>
                    {attributes.map(([key, value]) => (
                      <div key={key}>
                        <dt>{key.replace(/-/g, ' ')}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                    {product.sku && (
                      <div>
                        <dt>SKU</dt>
                        <dd>{product.sku}</dd>
                      </div>
                    )}
                  </dl>
                </details>
              )}
              <details>
                <summary>Shipping & returns</summary>
                <p>
                  See our <Link to="/shipping">shipping</Link>, <Link to="/returns">returns</Link> and <Link to="/exchanges">exchanges</Link> policies.
                </p>
              </details>
            </div>

            {!!product.collectionIds?.length && (
              <div className="nx-pd-cols">
                <span>Found in</span>
                {product.collectionIds.map((c) => (
                  <Link key={c._id || c} to={`/collection/${c.slug || c}`}>
                    {c.name || c.slug}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Related product={product} />

      <StudioBand title="Want this feeling in your own counts?" body="Compose a strand in the studio — Mulank, zodiac, and a name." />

      {/* phone: keep the price and the bag button in reach */}
      <div className="nx-pd-bar">
        <span>
          <b>{formatInr(product.price)}</b>
          {off > 0 && <s>{formatInr(was)}</s>}
        </span>
        <button type="button" className="nx-btn" disabled={soldOut} onClick={add}>
          {soldOut ? 'Sold out' : added ? 'Added ✓' : 'Add to bag'}
        </button>
      </div>
    </div>
  );
}
