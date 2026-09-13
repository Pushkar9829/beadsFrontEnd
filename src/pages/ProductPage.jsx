import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import QtyControl from '../components/ui/QtyControl';
import Spinner from '../components/ui/Spinner';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import CmsFinale from '../components/ui/CmsFinale';
import SeoHead from '../components/SeoHead';

export default function ProductPage() {
  const site = useSite();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => (product ? s.has(product._id) : false));
  const toggleWish = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    api.get(`/products/${slug}`).then(({ data }) => setProduct(data.product)).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [slug]);

  const house = houseMeta(site, product?.family);
  const crumbs = [
    { label: 'Home', to: '/' },
    house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop All', to: '/shop' },
    { label: product?.name || 'Piece' },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={crumbs} />

        {loading ? (
          <Spinner />
        ) : !product ? (
          <CmsFinale block={site.pages.product.missing} />
        ) : (
          <>
          <SeoHead
            title={product.seo?.title || `${product.name} · Kuberstones`}
            description={product.seo?.description || product.shortDescription}
            keywords={product.seo?.keywords}
            image={product.seo?.ogImage || product.images?.[0]}
            noIndex={product.seo?.noIndex}
          />
          <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-2 lg:gap-14">
            <GemVisual
              color={product.colorHex}
              image={product.images?.[0]}
              name={product.name}
              className="h-72 w-full rounded-[1.25rem] sm:h-[28rem]"
            />
            <div>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gold sm:text-[11px] sm:tracking-[0.28em]">
                    {house?.name || product.family}
                  </p>
                  <h1 className="mt-2 font-serif text-2xl gold-text sm:text-3xl md:text-4xl">{product.name}</h1>
                  {product.shortDescription && (
                    <p className="mt-3 text-sm leading-relaxed text-lilac md:text-base">{product.shortDescription}</p>
                  )}
                  <p className="mt-4 font-serif text-2xl text-gold sm:text-3xl">
                    <Price value={product.price} />
                  </p>
                  {(product.originalPrice || product.compareAtPrice) && (
                    <p className="mt-1 text-sm text-lilac line-through">
                      <Price value={product.originalPrice || product.compareAtPrice} />
                    </p>
                  )}
                  {product.flashSale && (
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-gold">Flash sale · {product.flashSale.name}</p>
                  )}
                </div>
                <div className="product-card-tools">
                  <button
                    type="button"
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={() => toggleWish(product)}
                    className={`product-tool ${wishlisted ? 'is-on' : ''}`}
                  >
                    <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    aria-label="Add to cart"
                    onClick={async () => {
                      await addProduct(product, qty);
                      setAdded(true);
                    }}
                    className="product-tool"
                  >
                    <ShoppingBag size={15} />
                  </button>
                </div>
              </div>

              {product.description && (
                <p className="mt-6 leading-relaxed text-ivory/80">{product.description}</p>
              )}

              {product.stock <= 0 && (
                <p className="mt-4 text-sm text-red-300">Currently out of stock.</p>
              )}
              {product.stock > 0 && product.stock <= (product.lowStockLimit ?? 5) && (
                <p className="mt-4 text-sm text-gold">Low stock — {product.stock} left.</p>
              )}

              {Object.keys(product.attributes || {}).length > 0 && (
                <dl className="mt-6 space-y-2 text-sm">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 border-b border-gold/10 py-1.5">
                      <dt className="uppercase tracking-widest text-gold">{key.replace(/-/g, ' ')}</dt>
                      <dd className="text-lilac">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {!!product.collectionIds?.length && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.collectionIds.map((c) => (
                    <Link key={c._id || c} to={`/collection/${c.slug || c}`} className="rounded-full border border-gold/30 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
                      {c.name || c.slug}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
                <QtyControl value={qty} min={1} onChange={setQty} />
                <Button
                  className="w-full min-[420px]:w-auto"
                  onClick={async () => {
                    await addProduct(product, qty);
                    setAdded(true);
                  }}
                >
                  Add to bag
                </Button>
              </div>
              {added && <p className="mt-3 text-sm text-gold">Added to bag.</p>}

              <article className="auth-card mt-10">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">The studio</p>
                <h2 className="mt-2 font-serif text-2xl gold-text">Want this feeling in your own counts?</h2>
                <p className="mt-2 text-sm text-lilac">Compose a strand in the studio — Mulank, zodiac, and a name.</p>
                <Button to="/customize" className="mt-5 w-full min-[420px]:w-auto">Customization</Button>
              </article>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
