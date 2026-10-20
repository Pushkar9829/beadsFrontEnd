// 404. The source has no 404 page, so this follows the nearest source pattern, the About page of
// beeds_ecommerce/src/pages/InfoPages.jsx (lines 104-165): eyebrow, section title, text, action card.
// Copy: admin → Site pages → 404. Styles: styles/atelier/info.css.
import { Link } from 'react-router-dom';
import { useSite } from '../store/contentStore';

export default function NotFoundPage() {
  const page = useSite().pages.notFound || {};
  return (
    <div className="info-page">
      <div className="container-custom info-narrow">
        <span className="section-eyebrow">404</span>
        <h1 className="section-title info-title">{page.title || 'Page not found'}</h1>
        {page.body && (
          <div className="info-prose">
            <p>{page.body}</p>
          </div>
        )}
        <div className="info-card">
          <div>
            <h3 className="info-card-title">Explore The House</h3>
          </div>
          <div className="info-card-acts">
            <Link to={page.to || '/'} className="btn-gold">
              {page.cta || 'Return home'}
            </Link>
            <Link to="/shop" className="btn-outline">
              Shop all
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
