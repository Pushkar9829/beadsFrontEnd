import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Card from './Card';
import GemVisual from './GemVisual';
import Price from './Price';
import ProductRating from './ProductRating';
import FlashSaleMark from './FlashSaleMark';

export default function ProductCard({ product, description }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const wishlisted = useWishlistStore((s) => s.has(product._id));
  const toggleWish = useWishlistStore((s) => s.toggle);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(107,63,160,0.18)]">
      <Link to={`/p/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          <GemVisual
            color={product.colorHex}
            image={product.images?.[0]}
            className="h-32 w-full transition duration-500 group-hover:scale-[1.04] sm:h-40"
            name={product.name}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent opacity-80" />
          {product.flashSale && <FlashSaleMark className="product-card-flash" />}
        </div>
      </Link>
      <div className="product-card-body">
        <Link to={`/p/${product.slug}`} className="product-card-copy">
          {product.family && (
            <p className="text-[9px] uppercase tracking-[0.18em] text-gold">{product.family}</p>
          )}
          <h3 className="mt-1 font-serif text-base leading-snug sm:text-lg">{product.name}</h3>
          <ProductRating product={product} />
        </Link>
        <div className="product-card-split">
          <div className="product-card-left">
            {description && <p className="product-card-desc line-clamp-2">{description}</p>}
            <p className="product-card-price">
              <Price value={product.price} />
              {(product.originalPrice || product.compareAtPrice) > product.price && (
                <span className="product-card-was">
                  <Price value={product.originalPrice || product.compareAtPrice} />
                </span>
              )}
            </p>
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
              onClick={() => addProduct(product, 1)}
              className="product-tool"
            >
              <ShoppingBag size={15} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
