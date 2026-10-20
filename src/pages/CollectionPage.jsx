import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CatEmpty, CollectionTiles, GridSkeleton, heroMeta, PageHero, ProductListing, StudioAction } from '../components/home/nocturne/Listing';

export default function CollectionPage() {
  const site = useSite();
  const brand = useBrand();
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

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
  const heroImage = collection?.image ? mediaUrl(collection.image) : products[0]?.images?.[0] ? mediaUrl(products[0].images[0]) : HOUSE_IMAGES.crystals;
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection?.name || 'Collection' }];

  if (missing) {
    const block = site.pages.category.missing;
    return (
      <div className="nx nx-page">
        <PageHero image={HOUSE_IMAGES.crystals} crumbs={crumbs} eyebrow={block?.kicker} title={block?.title || 'Collection not found.'} body={block?.copy} />
        <section className="category-pieces-section">
          <div className="container-custom">
            <CatEmpty block={{ title: 'Keep exploring.', primaryCta: block?.primaryCta }} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(collection?.name || 'Collection', brand)} description={collection?.description} keywords={brand.seo?.keywords} image={collection?.image || brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
       
        image={loading ? null : heroImage}
        crumbs={crumbs}
        eyebrow="Sacred collection"
        title={collection?.name || ' '}
        body={collection?.description}
        meta={loading ? [] : heroMeta(products.length)}
        actions={<StudioAction site={site} />}
      />

      {loading ? (
        <GridSkeleton />
      ) : (
        <ProductListing eyebrow={site.pages.collections?.inEyebrow} title={site.pages.category?.listTitle || 'Pieces'} products={products} chips={chips} filterBy={filterBy} empty={<CatEmpty block={site.pages.category.empty} />}>
          {/* Closing "Inside the house" cards, as on the source listing pages: the other collections. */}
          <CollectionTiles
            inline
            eyebrow={site.pages.collections?.moreTitle || 'Inside the house'}
            title={`${collection?.name || 'The'} collections`}
            items={others.slice(0, 6).map((c) => ({ key: c._id, to: `/collection/${c.slug}`, title: c.name, body: c.description, image: c.image ? mediaUrl(c.image) : null }))}
          />
        </ProductListing>
      )}

    </div>
  );
}
