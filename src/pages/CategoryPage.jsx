import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import { FAMILIES } from '../lib/format';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMissing(false);
    Promise.all([api.get(`/categories/${slug}`), api.get(`/products?category=${slug}`)])
      .then(([c, p]) => {
        setCategory(c.data.category);
        setProducts(p.data.products || []);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const house = FAMILIES.find((f) => f.slug === category?.family);

  const crumbs = [
    { label: 'Home', to: '/' },
    house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop All', to: '/shop' },
    { label: category?.name || 'Collection' },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-10 sm:py-12 md:py-16">
        <Breadcrumbs items={crumbs} />

        {loading ? (
          <Spinner />
        ) : missing ? (
          <InViewGroup className="finale-stage mt-10">
            <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Missing</p>
              <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">Collection not found.</h2>
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                This category is not published yet.
              </p>
              <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                <Button to="/shop" className="w-full min-[420px]:w-auto">Shop All</Button>
                <Button to="/customize" variant="ghost" className="w-full min-[420px]:w-auto">Customization</Button>
              </div>
            </div>
          </InViewGroup>
        ) : (
          <>
            <div className="mt-8">
              <SectionHead
                eyebrow={house?.name || category.family}
                title={category.name}
                body={category.description}
                to="/customize"
                action="Customization →"
              />
            </div>

            {products.length === 0 ? (
              <InViewGroup className="finale-stage mt-10">
                <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
                  <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
                  <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">No pieces here yet.</h2>
                  <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                    The atelier will add them — or compose a strand in the studio.
                  </p>
                  <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                    <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                    <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
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
          </>
        )}
      </div>
    </div>
  );
}
