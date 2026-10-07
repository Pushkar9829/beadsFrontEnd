import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SeoHead from '../components/SeoHead';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../components/customizer/PurposeGrid';
import StudioPaths from '../components/customizer/StudioPaths';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { PageIntro } from '../components/home/nocturne/Listing';

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

  return (
    <div className="nx nx-page nx-studio">
      <SeoHead title={pageTitle(title, brand)} description={copy.pageBody || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageIntro compact crumbs={[{ label: 'Home', to: '/' }, { label: brand.nav.customize, to: '/customize' }, { label: copy.title || 'By purpose' }]} title={title} body={copy.pageBody || copy.body} />
      <div className="nx-w nx-studio-body">
        <StudioPaths />
        {loading ? (
          <div className="nx-ptiles">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="nx-skel nx-ptile-skel" />
            ))}
          </div>
        ) : purposes.length ? (
          <div className="nx-ptiles">
            {purposes.map((p, i) => (
              <Link key={p._id || p.slug} to={`/customize?path=purpose&purpose=${p.slug}`} className="nx-ptile" style={purposeToneStyle(p)}>
                <span className="nx-ptile-n">{String(i + 1).padStart(2, '0')}</span>
                <span className={`nx-ptile-art${purposeHasImage(p) ? ' is-photo' : ' is-glyph'}`} aria-hidden>
                  <PurposeIcon purpose={p} />
                </span>
                <span className="nx-ptile-h">{p.name}</span>
                {p.description && <span className="nx-ptile-p">{p.description}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="nx-lede">Purposes will appear here once the studio is configured.</p>
        )}
      </div>
    </div>
  );
}
