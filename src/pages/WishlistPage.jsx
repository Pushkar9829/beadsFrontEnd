import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const addProduct = useCartStore((s) => s.addProduct);

  if (!items.length) {
    return (
      <EmptyState title="Your wishlist is empty" body="Save pieces you love — they wait here until you are ready.">
        <Button to="/shop">Browse the houses</Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-3xl gold-text">Wishlist</h1>
      <p className="mt-2 text-sm text-lilac">{items.length} saved {items.length === 1 ? 'piece' : 'pieces'}.</p>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li key={item._id} className="flex gap-4 rounded-2xl p-4 gold-border">
            <Link to={`/p/${item.slug}`}>
              <GemVisual
                color={item.colorHex}
                image={item.images?.[0]}
                className="h-20 w-20 rounded-xl"
                name={item.name}
              />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold">{item.family}</p>
                <Link to={`/p/${item.slug}`} className="font-serif text-lg hover:text-gold">
                  {item.name}
                </Link>
                <p className="text-gold">
                  <Price value={item.price} />
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addProduct(item, 1)}>Add to cart</Button>
                <Button variant="ghost" onClick={() => remove(item._id)}>Remove</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
