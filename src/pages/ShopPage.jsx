import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import { fillCopy, houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Shop All' },
];

export default function ShopPage() {
  const site = useSite();
  const page = site.pages.shop;
  const houses = site.houses?.items || [];
  const [params, setParams] = useSearchParams();
  const family = params.get('family') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = family ? `?family=${family}` : '';
    api.get(`/products${q}`).then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false));
  }, [family]);

  const house = houseMeta(site, family);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={
              house
                ? fillCopy(page.familyBody, { house: house.name.toLowerCase() })
                : page.body
            }
            to={page.to}
            action={page.action}
          />
        </div>

        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setParams({})}
            className={`shop-chip ${!family ? 'is-on' : ''}`}
          >
            All
          </button>
          {houses.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => setParams({ family: f.slug })}
              className={`shop-chip ${family === f.slug ? 'is-on' : ''}`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <CmsFinale block={page.empty} />
        ) : (
          <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((p, i) => (
              <div key={p._id} className="feature-item h-full" style={{ '--i': i }}>
                <ProductCard product={p} description={p.shortDescription} />
              </div>
            ))}
          </InViewGroup>
        )}
      </div>
    </div>
  );
}
