import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Wishlist' },
];

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const addProduct = useCartStore((s) => s.addProduct);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8">
          <SectionHead
            eyebrow="The atelier"
            title="Wishlist"
            body={
              items.length
                ? `${items.length} saved ${items.length === 1 ? 'piece' : 'pieces'} — held here until you are ready.`
                : 'Save pieces you love. They wait here until you are ready.'
            }
            to="/shop"
            action="Shop all →"
          />
        </div>

        {items.length === 0 ? (
          <InViewGroup className="finale-stage mt-10">
            <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
            <h2 className="mt-3 font-serif text-2xl gold-text sm:text-3xl">Nothing saved yet.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-lilac">
              Begin in the houses, or compose a strand in the studio.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button to="/shop" className="w-full min-[420px]:w-auto">Shop All</Button>
              <Button to="/customize" variant="ghost" className="w-full min-[420px]:w-auto">Customization</Button>
            </div>
            </div>
          </InViewGroup>
        ) : (
          <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item, i) => (
              <div key={item._id} className="feature-item h-full" style={{ '--i': i }}>
                <article className="wish-card">
                  <Link to={`/p/${item.slug}`} className="block">
                    <div className="wish-card-media">
                      <GemVisual
                        color={item.colorHex}
                        image={item.images?.[0]}
                        className="h-44 w-full sm:h-52"
                        name={item.name}
                      />
                    </div>
                  </Link>
                  <div className="flex flex-1 items-stretch gap-3 p-[1.1rem_1.15rem_1.15rem]">
                    <Link to={`/p/${item.slug}`} className="min-w-0 flex-1">
                      {item.family && (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{item.family}</p>
                      )}
                      <h3 className="mt-2 font-serif text-xl leading-snug">{item.name}</h3>
                      {item.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-lilac">{item.shortDescription}</p>
                      )}
                      <p className="mt-3 text-gold">
                        <Price value={item.price} />
                      </p>
                    </Link>
                    <div className="product-card-tools">
                      <button
                        type="button"
                        aria-label="Add to bag"
                        onClick={() => addProduct(item, 1)}
                        className="product-tool"
                      >
                        <ShoppingBag size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove from wishlist"
                        onClick={() => remove(item._id)}
                        className="product-tool is-on"
                      >
                        <Heart size={15} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </InViewGroup>
        )}
      </div>
    </div>
  );
}
