import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { BannerRow, CmsEmpty, GridSkeleton, PageHero, ProductListing, StudioBand } from '../components/home/nocturne/Listing';

export default function CollectionPage() {
  const site = useSite();
  const brand = useBrand();
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMissing(false);
    api
      .get(`/collections/${slug}`)
      .then(({ data }) => {
        if (!alive) return;
        setCollection(data.collection);
        setProducts(data.products || []);
      })
      .catch(() => alive && setMissing(true))
      .finally(() => alive && setLoading(false));
    api
      .get('/banners?placement=collection')
      .then(({ data }) => alive && setBanners(data.banners || []))
      .catch(() => {});
    api
      .get('/collections')
      .then(({ data }) => alive && setOthers((data.collections || []).filter((c) => c.slug !== slug)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  const houses = useMemo(() => site.houses?.items || [], [site.houses]);
  const chips = useMemo(
    () =>
      houses
        .map((h) => ({ value: h.slug, label: h.name, count: products.filter((p) => p.family === h.slug).length }))
        .filter((c) => c.count > 0),
    [houses, products]
  );
  const filterBy = useCallback((p, family) => p.family === family, []);
  const ownBanners = banners.filter((b) => !b.link || String(b.link).includes(`/collection/${slug}`));
  const heroImage = collection?.image ? mediaUrl(collection.image) : products[0]?.images?.[0] ? mediaUrl(products[0].images[0]) : HOUSE_IMAGES.crystals;
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection?.name || 'Collection' }];

  if (missing) {
    const block = site.pages.category.missing;
    return (
      <div className="nx nx-page">
        <PageHero size="short" image={HOUSE_IMAGES.crystals} crumbs={crumbs} eyebrow={block?.kicker} title={block?.title || 'Collection not found.'} body={block?.copy} />
        <div className="nx-w nx-sec">
          <CmsEmpty block={{ ...block, title: 'Keep exploring.', copy: '' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(collection?.name || 'Collection', brand)} description={collection?.description} keywords={brand.seo?.keywords} image={collection?.image || brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
        size="short"
        image={loading ? null : heroImage}
        crumbs={crumbs}
        eyebrow="Collection"
        title={collection?.name || ' '}
        body={collection?.description}
        meta={loading ? [] : [`${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`]}
        actions={
          <Link to="/collections" className="nx-lnk">
            All collections →
          </Link>
        }
      />

      <BannerRow banners={ownBanners} />

      {loading ? (
        <GridSkeleton />
      ) : (
        <ProductListing eyebrow="In this collection" title="The pieces" products={products} chips={chips} filterBy={filterBy} empty={<CmsEmpty block={site.pages.category.empty} />} />
      )}

      {others.length > 0 && (
        <div className="nx-w nx-more">
          <p className="nx-eb">More collections</p>
          <div className="nx-more-row">
            {others.map((c) => (
              <Link key={c._id} to={`/collection/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <StudioBand />
    </div>
  );
}
