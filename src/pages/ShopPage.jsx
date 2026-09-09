import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import { FAMILIES } from '../lib/format';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Shop All' },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const family = params.get('family') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = family ? `?family=${family}` : '';
    api.get(`/products${q}`).then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false));
  }, [family]);

  const house = FAMILIES.find((f) => f.slug === family);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8">
          <SectionHead
            eyebrow="The collection"
            title="Shop All"
            body={
              house
                ? `Ready-made pieces from the house of ${house.name.toLowerCase()}.`
                : 'Ready-made pieces across crystals, rudraksha and gemstones.'
            }
            to="/customize"
            action="Customization →"
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
          {FAMILIES.map((f) => (
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
          <InViewGroup className="finale-stage mt-10">
            <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
              <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">No pieces listed yet.</h2>
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                Begin a custom strand, or enter one of the three houses.
              </p>
              <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                <Button to="/crystals" variant="ghost" className="w-full min-[420px]:w-auto">The houses</Button>
              </div>
            </div>
          </InViewGroup>
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
