import { Link } from 'react-router-dom';
import { useSite } from '../store/contentStore';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { PageHero } from '../components/home/nocturne/Listing';

export default function NotFoundPage() {
  const page = useSite().pages.notFound;
  return (
    <div className="nx nx-page">
      <PageHero
        image={HOUSE_IMAGES.rudraksha}
        eyebrow="404"
        title={page.title || 'Page not found'}
        body={page.body}
        actions={
          <>
            <Link to={page.to || '/'} className="nx-btn">
              {page.cta || 'Return home'}
            </Link>
            <Link to="/shop" className="nx-btn nx-btn-o">
              Shop all
            </Link>
          </>
        }
      />
    </div>
  );
}
