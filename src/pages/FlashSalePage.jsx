import { useCallback, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import FlashCountdown from '../components/FlashCountdown';
import FlashSaleMark from '../components/ui/FlashSaleMark';
import InViewGroup from '../components/ui/InViewGroup';
import CmsFinale from '../components/ui/CmsFinale';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function FlashSalePage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.flash || {};
  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/flash-sales/active')
      .then(({ data }) => {
        setSale(data.sale);
        setProducts(data.products || []);
      })
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  return (
    <div className="relative">
      <SeoHead title={pageTitle(sale?.name || copy.label || 'Flash sale', brand)} description={copy.pageBody || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: copy.label || 'Flash sale' }]} />
        {loading ? <Spinner /> : !sale ? (
          <CmsFinale block={{
            kicker: copy.label || 'Flash sale',
            title: copy.emptyTitle || 'No sale is running.',
            copy: copy.emptyBody || copy.pageBody,
            primaryCta: { label: copy.action || 'Shop All', to: '/shop' },
          }} />
        ) : (
          <>
            <div className="mt-8">
              <SectionHead eyebrow={<FlashSaleMark size="md" label={copy.label || 'Flash sale'} />} title={sale.name} body={copy.pageBody || copy.body} />
            </div>
            <div className="mt-6 max-w-md">
              <FlashCountdown sale={sale} />
            </div>
            {products.length === 0 ? (
              <p className="mt-10 text-lilac">{copy.emptyProducts || 'Products for this sale are being placed.'}</p>
            ) : (
              <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((p, i) => (
                  <div key={p._id} className="feature-item h-full" style={{ '--i': i }}>
                    <ProductCard product={p} description={p.shortDescription} />
                  </div>
                ))}
              </InViewGroup>
            )}
          </>
        )}
      </div>
    </div>
  );
}

