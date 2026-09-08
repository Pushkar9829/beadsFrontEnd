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
    <Card className="group relative overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(107,63,160,0.18)]">
      <Link to={`/p/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          <GemVisual
            color={product.colorHex}
            image={product.images?.[0]}
            className="h-40 w-full transition duration-500 group-hover:scale-[1.04] sm:h-48"
            name={product.name}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent opacity-80" />
        </div>
        <div className="p-4">
          {product.family && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{product.family}</p>
          )}
          <h3 className="mt-1 font-serif text-xl leading-snug">{product.name}</h3>
          {description && <p className="mt-1 line-clamp-2 text-sm text-lilac">{description}</p>}
          <p className="mt-2 text-gold">
            <Price value={product.price} />
          </p>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWish(product);
          }}
          className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition duration-200 hover:scale-110 ${
            wishlisted
              ? 'border-gold bg-gold text-ink'
              : 'border-gold/30 bg-black/70 text-ivory hover:border-gold hover:text-gold'
          }`}
        >
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          aria-label="Add to cart"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addProduct(product, 1);
          }}
          className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-black/70 text-ivory backdrop-blur-md transition duration-200 hover:scale-110 hover:border-gold hover:text-gold"
        >
          <ShoppingBag size={15} />
        </button>
      </div>
    </Card>
  );
}
