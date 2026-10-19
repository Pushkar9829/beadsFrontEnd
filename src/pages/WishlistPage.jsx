// Wishlist, ported from beeds_ecommerce/src/pages/WishlistPage.jsx (cream page, "SACRED wishlist" title,
// card grid, logo empty state). Copy: admin → Site pages → Wishlist. Styles: styles/atelier/commerce.css.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useSite } from '../store/contentStore';
import { NCard } from '../components/home/nocturne/Nocturne';
import emblem from '../assets/brand/emblem.png';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

export default function WishlistPage() {
  const page = useSite().pages.wishlist || {};
  const empty = page.emptyState || {};
  const items = useWishlistStore((s) => s.items);

  return (
    <div className="wl-page">
      <div className="container-custom">
        <div className="wl-head">
          {page.kicker && <span className="wl-eyebrow">{page.kicker}</span>}
          <h1 className="wl-title">
            {page.heading || 'Sacred'} {page.headingTail && <span className="wl-title-italic">{page.headingTail}</span>}
          </h1>
          {page.intro && <p className="wl-sub">{page.intro}</p>}
        </div>

        {items.length === 0 ? (
          <div className="wl-empty">
            <img src={emblem} alt="Kuberstones" className="wl-empty-logo" />
            <h2 className="wl-empty-title">{empty.title || 'Your Wishlist is Empty'}</h2>
            {empty.copy && <p className="wl-empty-copy">{empty.copy}</p>}
            <Link to={empty.primaryCta?.to || '/shop'} className="btn-gold wl-empty-btn">
              <span>{clean(empty.primaryCta?.label) || 'Explore All Pieces'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="wl-grid">
            {items.map((item) => (
              <NCard key={item._id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
