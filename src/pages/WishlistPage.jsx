import { Link } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlistStore';
import { fillCopy } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { NCard } from '../components/home/nocturne/Nocturne';
import { CmsEmpty, PageIntro } from '../components/home/nocturne/Listing';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

export default function WishlistPage() {
  const page = useSite().pages.wishlist;
  const items = useWishlistStore((s) => s.items);
  const body = items.length ? fillCopy(page.filledBody, { count: items.length, pieces: items.length === 1 ? 'piece' : 'pieces' }) : page.emptyBody;

  return (
    <div className="nx nx-page">
      <PageIntro
        crumbs={[{ label: 'Home', to: '/' }, { label: page.title || 'Wishlist' }]}
        eyebrow={page.eyebrow}
        title={page.title || 'Wishlist'}
        body={body}
        actions={
          page.to && (
            <Link to={page.to} className="nx-lnk">
              {clean(page.action) || 'Shop all'} →
            </Link>
          )
        }
      />
      <section className="nx-sec">
        <div className="nx-w">
          {items.length === 0 ? (
            <CmsEmpty block={page.empty} />
          ) : (
            <div className="nx-grid">
              {items.map((item, i) => (
                <div key={item._id} className="nx-grid-item" style={{ '--i': Math.min(i, 12) }}>
                  <NCard product={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
