import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../components/customizer/PurposeGrid';
import StudioModeNav from '../components/customizer/StudioModeNav';
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
    api.get('/customizer/purposes')
      .then(({ data }) => setPurposes(data.purposes || []))
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  return (
    <div className="relative">
      <SeoHead title={pageTitle(copy.pageTitle || copy.title || 'Shop by purpose', brand)} description={copy.pageBody || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: brand.nav.customize, to: '/customize' }, { label: copy.title || 'By purpose' }]} />
        <div className="mt-8">
          <SectionHead eyebrow={copy.pageEyebrow || copy.eyebrow} title={copy.pageTitle || copy.title || 'Customise by purpose'} body={copy.pageBody || copy.body} />
        </div>
        <StudioModeNav />
        {loading ? <Spinner /> : (
          <div className="purpose-pick mt-10">
            {purposes.map((p) => (
              <Link key={p._id || p.slug} to={`/customize?purpose=${p.slug}`} className="purpose-pick-card" style={purposeToneStyle(p)}>
                <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
                  <PurposeIcon purpose={p} />
                </span>
                <span className="purpose-pick-copy">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </span>
              </Link>
            ))}
            {!purposes.length && <p className="text-lilac">Purposes will appear here once the studio is configured.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
