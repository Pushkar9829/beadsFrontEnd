import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';

export default function CollectionPage() {
  const site = useSite();
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/collections/${slug}`)
      .then(({ data }) => {
        setCollection(data.collection);
        setProducts(data.products || []);
        setMissing(false);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
    api.get('/banners?placement=collection').then(({ data }) => setBanners(data.banners || [])).catch(() => {});
  }, [slug]);

  return (
    <div className="relative">
      <SeoHead title={collection ? `${collection.name} · Kuberstones` : 'Collection · Kuberstones'} description={collection?.description} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop All', to: '/shop' }, { label: collection?.name || 'Collection' }]} />
        {loading ? <Spinner /> : missing ? (
          <CmsFinale block={site.pages.category.missing} />
        ) : (
          <>
            <div className="mt-8">
              <SectionHead eyebrow="Collection" title={collection.name} body={collection.description} to="/collections" action="All collections →" />
            </div>
            {banners.length > 0 && (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {banners.slice(0, 2).map((b) => (
                  <Link key={b._id} to={b.link || `/collection/${slug}`} className="overflow-hidden rounded-2xl border border-gold/20">
                    <img src={mediaUrl(b.image)} alt={b.title} className="h-36 w-full object-cover" />
                  </Link>
                ))}
              </div>
            )}
            {products.length === 0 ? (
              <CmsFinale block={site.pages.category.empty} />
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
