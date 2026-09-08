import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import { FAMILIES } from '../lib/format';

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

  return (
    <div className="shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl gold-text">Shop All</h1>
          <p className="mt-2 text-lilac">Ready-made pieces across crystals, rudraksha and gemstones.</p>
        </div>
        <Button to="/customize">Customization</Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParams({})}
          className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest ${!family ? 'bg-amethyst' : 'border border-gold/30 text-lilac'}`}
        >
          All
        </button>
        {FAMILIES.map((f) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => setParams({ family: f.slug })}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest ${family === f.slug ? 'bg-amethyst' : 'border border-gold/30 text-lilac'}`}
          >
            {f.name}
          </button>
        ))}
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
