import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import { houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';

export default function CategoryPage() {
  const site = useSite();
  const page = site.pages.category;
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

  const house = houseMeta(site, category?.family);

  const crumbs = [
    { label: 'Home', to: '/' },
    house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop All', to: '/shop' },
    { label: category?.name || 'Collection' },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={crumbs} />

        {loading ? (
          <Spinner />
        ) : missing ? (
          <CmsFinale block={page.missing} />
        ) : (
          <>
            <div className="mt-8">
              <SectionHead
                eyebrow={house?.name || category.family}
                title={category.name}
                body={category.description}
                to={page.to}
                action={page.action}
              />
            </div>

            {products.length === 0 ? (
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
          </>
        )}
      </div>
    </div>
  );
}
