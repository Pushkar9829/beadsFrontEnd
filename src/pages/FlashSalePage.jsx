import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import FlashCountdown from '../components/FlashCountdown';
import InViewGroup from '../components/ui/InViewGroup';
import CmsFinale from '../components/ui/CmsFinale';
import { useSite } from '../store/contentStore';

export default function FlashSalePage() {
  const site = useSite();
  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/flash-sales/active')
      .then(({ data }) => {
        setSale(data.sale);
        setProducts(data.products || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <SeoHead title={sale ? `${sale.name} · Kuberstones` : 'Flash sale · Kuberstones'} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Flash sale' }]} />
        {loading ? <Spinner /> : !sale ? (
          <CmsFinale block={site.pages.shop.empty} />
        ) : (
          <>
            <div className="mt-8">
              <SectionHead eyebrow="Flash sale" title={sale.name} body="Timed prices. When the clock ends, the list returns to the atelier rate." />
            </div>
            <div className="mt-6 max-w-md">
              <FlashCountdown sale={sale} />
            </div>
            {products.length === 0 ? (
              <p className="mt-10 text-lilac">Products for this sale are being placed.</p>
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
