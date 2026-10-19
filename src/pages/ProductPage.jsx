import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import api, { mediaUrl } from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { houseMeta } from '../lib/homeContent';
import { resolveProductRating, formatReviewCount } from '../lib/productRating';
import { formatInr } from '../lib/format';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES, NCard, useCountdown } from '../components/home/nocturne/Nocturne';
import { SectionTitle } from '../components/home/atelier/AtelierHome';
import emblem from '../assets/brand/emblem.png';
import { CmsEmpty, PageHero } from '../components/home/nocturne/Listing';

const pad = (n) => String(n).padStart(2, '0');

function SaleTimer({ sale }) {
  const t = useCountdown(sale?.endsAt);
  if (!sale || !t || t.done) return null;
  return (
    <p className="pd-sale">
      <b>{sale.name || 'Flash sale'}</b> · ends in {t.d}d {pad(t.h)}h {pad(t.m)}m
    </p>
  );
}

function Related({ product, copy = {} }) {
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
    <div className="pd-related reveal-on-scroll">
      <div className="pd-related-head">
        <div>
          {copy.relatedEyebrow && <span className="section-eyebrow">{copy.relatedEyebrow}</span>}
          <SectionTitle text={copy.relatedTitle || 'You may also like'} />
        </div>
      </div>
      <div className="pd-related-grid reveal-stagger">
        {items.map((p) => (
          <NCard key={p._id} product={p} />
        ))}
      </div>
    </div>
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
      <div className="nx nx-page pd-page">
        <div className="container-custom">
          <div className="pd-grid">
            <div className="pd-skel" />
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
  const labels = site.pages.product || {};
  const images = product.images?.length ? product.images : [];
  const was = product.originalPrice || product.compareAtPrice;
  const off = was > product.price ? Math.round((1 - product.price / was) * 100) : 0;
  const { rating, reviewCount } = resolveProductRating(product);
  const soldOut = product.stock <= 0;
  const benefits = (product.benefits || []).filter(Boolean);
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
    <div className="nx nx-page pd-page">
      <SeoHead
        title={product.seo?.title || pageTitle(product.name, brand)}
        description={product.seo?.description || product.shortDescription}
        keywords={product.seo?.keywords}
        image={product.seo?.ogImage || product.images?.[0]}
        noIndex={product.seo?.noIndex}
      />
      <div className="container-custom">
        <nav className="pd-crumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
            ))}
          </ol>
        </nav>

        <div className="pd-grid">
          <div>
            <div className="pd-hero">
              {images.length ? (
                <img key={shot} src={mediaUrl(images[shot])} alt={product.name} fetchPriority="high" />
              ) : (
                <span className="pd-hero-tone" style={{ background: product.colorHex || '#22173A' }} />
              )}
              {off > 0 && (
                <div className="modern-badge-wrap">
                  <span className={`modern-card-badge ${product.flashSale ? 'badge-flash' : 'badge-default'}`}>{product.flashSale ? `FLASH −${off}%` : `−${off}%`}</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((src, i) => (
                  <button key={src} type="button" className={`pd-thumb${i === shot ? ' is-active' : ''}`} aria-label={`Image ${i + 1}`} onClick={() => setShot(i)}>
                    <img src={mediaUrl(src)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="pd-tag">
              {house?.name || product.family}
              {product.categoryId?.name ? ` · ${product.categoryId.name}` : ''}
            </span>
            <h1 className="pd-title">{product.name}</h1>
            {rating > 0 && reviewCount > 0 && (
              <div className="pd-rating">
                <div className="pd-stars" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} fill={i < Math.round(rating) ? '#D9AE4F' : 'none'} stroke="#D9AE4F" />
                  ))}
                </div>
                <span className="pd-rating-val">{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</span>
                <span className="pd-rating-dot">·</span>
                <span className="pd-rating-count">{formatReviewCount(reviewCount)} reviews</span>
              </div>
            )}

            <div className="pd-price-row">
              <span className="pd-price">{formatInr(product.price)}</span>
              {off > 0 && (
                <>
                  <span className="pd-was">{formatInr(was)}</span>
                  <span className="badge-flash">Save {off}%</span>
                </>
              )}
            </div>
            <SaleTimer sale={product.flashSale} />

            {(product.description || product.shortDescription) && <p className="pd-desc">{product.description || product.shortDescription}</p>}

            {attributes.map(([key, value]) => (
              <div key={key} className="pd-option">
                <span className="pd-option-label">{key.replace(/-/g, ' ')}</span>
                <div className="pd-option-pills">
                  {String(value)
                    .split(/\s*[,·]\s*/)
                    .filter(Boolean)
                    .map((v) => (
                      <span key={v} className="pill-tab active">
                        {v}
                      </span>
                    ))}
                </div>
              </div>
            ))}

            <div className="pd-buy">
              <div className="pd-stepper" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={qty <= 1 || soldOut} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty || soldOut} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
                  <Plus size={14} />
                </button>
              </div>
              <button type="button" className="btn-gold pd-add" disabled={soldOut} onClick={add}>
                <ShoppingBag size={16} />
                <span>{soldOut ? labels.soldOutLabel || 'Sold out' : labels.addLabel || 'Add to bag'}</span>
              </button>
              <button
                type="button"
                className={`pd-wish${wishlisted ? ' is-active' : ''}`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                onClick={() => toggleWish(product)}
              >
                <Heart size={18} fill={wishlisted ? '#D9AE4F' : 'none'} />
              </button>
            </div>
            {added && (
              <p className="pd-note" role="status">
                <Check size={14} /> Added to bag. <Link to="/cart">View bag →</Link>
              </p>
            )}
            {lowStock && <p className="pd-note is-warn">Only {product.stock} left.</p>}

            <div className="pd-seal">
              <img src={emblem} alt="" className="pd-seal-img" />
              <div>
                <div className="pd-seal-t">{site.pages.product?.shippingTitle || 'Shipping & returns'}</div>
                <p>
                  {site.pages.product?.shippingBody ? `${site.pages.product.shippingBody} ` : ''}
                  See our <Link to="/shipping">shipping</Link>, <Link to="/returns">returns</Link> and <Link to="/exchanges">exchanges</Link> policies.
                </p>
              </div>
            </div>

            {benefits.length > 0 && (
              <div className="pd-list">
                <span className="pd-list-h">{labels.benefitsLabel || 'Sacred energy & benefits'}</span>
                <ul>
                  {benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Related product={product} copy={site.pages.product} />
      </div>
    </div>
  );
}
