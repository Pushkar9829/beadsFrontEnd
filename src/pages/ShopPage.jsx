import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import api from '../api/client';
import { fillCopy, houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { BannerRow, CmsEmpty, GridSkeleton, NPager, PageHero, ProductListing, StudioBand } from '../components/home/nocturne/Listing';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

export default function ShopPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.shop;
  const houses = useMemo(() => site.houses?.items || [], [site.houses]);
  const [params, setParams] = useSearchParams();
  const family = params.get('family') || '';
  const collection = params.get('collection') || '';
  const pageNum = Math.max(1, Number(params.get('page') || 1));
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [tick, setTick] = useState(0);
  useRefreshOnView(() => setTick((n) => n + 1));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const qs = new URLSearchParams();
    if (family) qs.set('family', family);
    if (collection) qs.set('collection', collection);
    qs.set('page', String(pageNum));
    qs.set('limit', '24');
    api
      .get(`/products?${qs}`)
      .then(({ data }) => {
        if (!alive) return;
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: (data.products || []).length });
      })
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [family, collection, pageNum, tick]);

  useEffect(() => {
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).catch(() => {});
    api.get('/banners?placement=shop').then(({ data }) => setBanners(data.banners || [])).catch(() => {});
  }, [tick]);

  function setFilter(next) {
    const qs = new URLSearchParams();
    if (next.family) qs.set('family', next.family);
    if (next.collection) qs.set('collection', next.collection);
    if (next.page > 1) qs.set('page', String(next.page));
    setParams(qs);
  }

  const house = houseMeta(site, family);
  const activeCollection = collections.find((c) => c.slug === collection);
  const body = house ? fillCopy(page.familyBody, { house: house.name.toLowerCase() }) : page.body;
  const heroImage = HOUSE_IMAGES[family] || HOUSE_IMAGES.gemstones;
  const chips = houses.map((h) => ({ value: h.slug, label: h.name }));

  const collectionSelect = collections.length > 0 && (
    <label className="nx-sort">
      <span className="sr-only">Collection</span>
      <select value={collection} onChange={(e) => setFilter({ family, collection: e.target.value })}>
        <option value="">All collections</option>
        {collections.map((c) => (
          <option key={c._id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden />
    </label>
  );

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(house?.name || page.title, brand)} description={body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
        size="short"
        image={heroImage}
        crumbs={[{ label: 'Home', to: '/' }, { label: page.title || 'Shop all' }]}
        eyebrow={page.eyebrow}
        title={page.title || 'Shop all'}
        body={body}
        meta={loading ? [] : [`${pagination.total ?? products.length} ${pagination.total === 1 ? 'piece' : 'pieces'}`, activeCollection?.name].filter(Boolean)}
        actions={
          page.to && (
            <Link to={page.to} className="nx-lnk">
              {clean(page.action) || 'Customization'} →
            </Link>
          )
        }
      />

      <BannerRow banners={banners} />

      <ProductListing
        eyebrow={house ? `House of ${house.name.toLowerCase()}` : 'Every house'}
        title={activeCollection?.name || house?.name || 'All pieces'}
        products={loading ? [] : products}
        chips={chips}
        activeChip={family || 'all'}
        onChip={(v) => setFilter({ family: v === 'all' ? '' : v, collection })}
        extra={collectionSelect}
        total={loading ? undefined : pagination.total}
        empty={loading ? <GridSkeleton bare /> : <CmsEmpty block={page.empty} />}
        footer={<NPager page={pagination.page || pageNum} pages={pagination.pages || 1} onPage={(n) => { setFilter({ family, collection, page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      />

      <StudioBand />
    </div>
  );
}
