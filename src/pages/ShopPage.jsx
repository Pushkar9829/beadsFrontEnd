import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import { fillCopy, houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CatEmpty, CollectionTiles, GridSkeleton, heroMeta, houseTiles, NPager, PageHero, ProductListing, StudioAction } from '../components/home/nocturne/Listing';

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
  // A house filter shows that house's image (Homepage → Houses); otherwise the Shop page banner.
  const heroImage = house?.image ? mediaUrl(house.image) : family ? HOUSE_IMAGES[family] : page.image ? mediaUrl(page.image) : HOUSE_IMAGES.gemstones;
  const chips = houses.map((h) => ({ value: h.slug, label: h.name }));
  // "Inside the house" cards closing the pieces section, as on the source Shop All page.
  const tiles = houseTiles(site);

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(house?.name || page.title, brand)} description={body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
       
        image={heroImage}
        crumbs={[{ label: 'Home', to: '/' }, { label: page.title || 'Shop all' }]}
        eyebrow={page.eyebrow}
        title={page.title || 'Shop all'}
        body={body}
        meta={loading ? [] : heroMeta(pagination.total ?? products.length)}
        actions={<StudioAction site={site} />}
      />

      <ProductListing
        eyebrow={page.listEyebrow}
        title={activeCollection?.name || house?.name || page.listTitle || 'Pieces'}
        products={loading ? [] : products}
        chips={chips}
        activeChip={family || 'all'}
        onChip={(v) => setFilter({ family: v === 'all' ? '' : v, collection })}
        allCount={!family && !collection && !loading ? pagination.total : undefined}
        total={loading ? undefined : pagination.total}
        empty={loading ? <GridSkeleton bare /> : <CatEmpty block={page.empty} />}
        footer={<NPager page={pagination.page || pageNum} pages={pagination.pages || 1} onPage={(n) => { setFilter({ family, collection, page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      >
        <CollectionTiles inline eyebrow={page.tilesEyebrow || 'Inside the house'} title={`${page.title || 'Shop all'} collections`} items={tiles} />
      </ProductListing>
    </div>
  );
}
