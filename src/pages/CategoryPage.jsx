import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import { houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';

export default function CategoryPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.category;
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [banners, setBanners] = useState([]);

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
    api.get('/banners?placement=category').then(({ data }) => setBanners(data.banners || [])).catch(() => {});
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
            <SeoHead
              title={category.seo?.title || pageTitle(category.name, brand)}
              description={category.seo?.description || category.description}
              keywords={category.seo?.keywords}
              image={category.seo?.ogImage || category.image}
              noIndex={category.seo?.noIndex}
            />
            {category.image ? (
              <img src={mediaUrl(category.image)} alt="" className="mt-8 h-44 w-full rounded-2xl object-cover" />
            ) : null}
            <div className="mt-8">
              <SectionHead
                eyebrow={house?.name || category.family}
                title={category.name}
                body={category.description}
                to={page.to}
                action={page.action}
              />
            </div>

            {banners.filter((b) => !b.link || String(b.link).includes(`/c/${slug}`)).slice(0, 2).length > 0 && (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {banners.filter((b) => !b.link || String(b.link).includes(`/c/${slug}`)).slice(0, 2).map((b) => (
                  <Link key={b._id} to={b.link || `/c/${slug}`} className="overflow-hidden rounded-2xl border border-gold/20">
                    <img src={mediaUrl(b.image)} alt={b.title} className="h-36 w-full object-cover" />
                  </Link>
                ))}
              </div>
            )}

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
