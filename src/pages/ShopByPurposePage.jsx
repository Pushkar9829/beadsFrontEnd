// /customize/purpose — no page of its own in the source; it renders the source's studio step 1
// (header, BEGIN BY pills and the purpose cards, beeds_ecommerce StudioBuilderPage.jsx L402-743),
// with each card linking into the purpose path. Classes: styles/atelier/studio.css.
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SeoHead from '../components/SeoHead';
import StudioPaths from '../components/customizer/StudioPaths';
import { PurposeCard } from '../components/customizer/steps/PurposePick';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function ShopByPurposePage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.purpose || {};
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api
      .get('/customizer/purposes')
      .then(({ data }) => setPurposes(data.purposes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const title = copy.pageTitle || copy.title || 'Customise by purpose';
  const body = copy.pageBody || copy.body;

  return (
    <div className="nx nx-studio sb-page">
      <SeoHead title={pageTitle(title, brand)} description={body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="sb-wrap">
        <div className="sb-head">
          <h1 className="sb-title">{title}</h1>
          {body && <p className="sb-sub">{body}</p>}
        </div>
        <StudioPaths />
        {loading ? (
          <div className="sb-cards">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="sb-skel" />
            ))}
          </div>
        ) : purposes.length ? (
          <div className="sb-cards">
            {purposes.map((p, i) => (
              <PurposeCard key={p._id || p.slug} as={Link} to={`/customize?path=purpose&purpose=${p.slug}`} purpose={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="sb-empty">Purposes will appear here once the studio is configured.</p>
        )}
      </div>
    </div>
  );
}
