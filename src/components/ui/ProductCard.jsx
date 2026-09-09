import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Card from './Card';
import GemVisual from './GemVisual';
import Price from './Price';

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
        </div>
      </Link>
      <div className="flex flex-1 items-stretch gap-2.5 p-3">
        <Link to={`/p/${product.slug}`} className="min-w-0 flex-1">
          {product.family && (
            <p className="text-[9px] uppercase tracking-[0.18em] text-gold">{product.family}</p>
          )}
          <h3 className="mt-1 font-serif text-base leading-snug sm:text-lg">{product.name}</h3>
          {description && <p className="mt-1 line-clamp-2 text-xs text-lilac">{description}</p>}
          <p className="mt-2 text-gold">
            <Price value={product.price} />
          </p>
        </Link>
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
    </Card>
  );
}
