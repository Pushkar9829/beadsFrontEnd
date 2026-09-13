import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import Pager from '../components/ui/Pager';
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
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const collection = params.get('collection') || '';
  const pageNum = Number(params.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (family) qs.set('family', family);
    if (collection) qs.set('collection', collection);
    qs.set('page', String(pageNum));
    qs.set('limit', '24');
    api.get(`/products?${qs}`).then(({ data }) => {
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.products || []).length });
    }).finally(() => setLoading(false));
  }, [family, collection, pageNum]);
  useEffect(() => {
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).catch(() => {});
    api.get('/banners?placement=shop').then(({ data }) => setBanners(data.banners || [])).catch(() => {});
  }, []);

  function setFilter(next) {
    const qs = new URLSearchParams();
    if (next.family) qs.set('family', next.family);
    if (next.collection) qs.set('collection', next.collection);
    setParams(qs);
  }

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

        {banners.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {banners.slice(0, 2).map((b) => (
              <Link key={b._id} to={b.link || '/shop'} className="overflow-hidden rounded-2xl border border-gold/20">
                <img src={mediaUrl(b.image)} alt={b.title} className="h-36 w-full object-cover" />
              </Link>
            ))}
          </div>
        )}

        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setFilter({})}
            className={`shop-chip ${!family && !collection ? 'is-on' : ''}`}
          >
            All
          </button>
          {houses.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => setFilter({ family: family === f.slug ? '' : f.slug, collection })}
              className={`shop-chip ${family === f.slug ? 'is-on' : ''}`}
            >
              {f.name}
            </button>
          ))}
          {collections.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setFilter({ family, collection: collection === c.slug ? '' : c.slug })}
              className={`shop-chip ${collection === c.slug ? 'is-on' : ''}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <CmsFinale block={page.empty} />
        ) : (
          <>
          <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((p, i) => (
              <div key={p._id} className="feature-item h-full" style={{ '--i': i }}>
                <ProductCard product={p} description={p.shortDescription} />
              </div>
            ))}
          </InViewGroup>
          <Pager
            page={pagination.page || pageNum}
            pages={pagination.pages || 1}
            total={pagination.total}
            onPage={(next) => {
              const qs = new URLSearchParams(params);
              qs.set('page', String(next));
              setParams(qs);
            }}
          />
          </>
        )}
      </div>
    </div>
  );
}
