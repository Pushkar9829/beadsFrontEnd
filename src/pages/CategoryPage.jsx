import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import { houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CatEmpty, CollectionTiles, GridSkeleton, heroMeta, PageHero, ProductListing, StudioAction } from '../components/home/nocturne/Listing';

export default function CategoryPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.category;
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [houseProducts, setHouseProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMissing(false);
    Promise.all([api.get(`/categories/${slug}`), api.get('/products', { params: { category: slug } })])
      .then(([c, p]) => {
        if (!alive) return;
        setCategory(c.data.category);
        setProducts(p.data.products || []);
        // Sibling collections in the same house, for "More from this house".
        const family = c.data.category.family;
        Promise.all([api.get('/categories', { params: { family } }), api.get('/products', { params: { family } })])
          .then(([t, hp]) => {
            if (!alive) return;
            setSiblings((t.data.tree?.[0]?.children || []).filter((s) => s.slug !== slug));
            setHouseProducts(hp.data.products || []);
          })
          .catch(() => {});
      })
      .catch(() => alive && setMissing(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const house = houseMeta(site, category?.family);
  const houseImage = house?.image ? mediaUrl(house.image) : HOUSE_IMAGES[category?.family];
  const heroImage = category?.image ? mediaUrl(category.image) : products[0]?.images?.[0] ? mediaUrl(products[0].images[0]) : houseImage;
  const crumbs = [{ label: 'Home', to: '/' }, house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop all', to: '/shop' }, { label: category?.name || 'Collection' }];

  const more = useMemo(() => {
    // Borrow a photo from the first piece in each sibling collection.
    const coverOf = (catSlug) => {
      const img = houseProducts.find((p) => p.categoryId?.slug === catSlug)?.images?.[0];
      return img ? mediaUrl(img) : null;
    };
    return (
      siblings.map((c) => ({
        key: c._id,
        to: c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`,
        title: c.name,
        body: c.description,
        image: c.image ? mediaUrl(c.image) : coverOf(c.slug) || houseImage,
        kicker: c.slug === 'customize-your-bracelet' ? 'Studio' : undefined,
      }))
    );
  }, [siblings, houseProducts, houseImage]);

  if (missing) {
    return (
      <div className="nx nx-page">
        <PageHero image={HOUSE_IMAGES.crystals} crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} eyebrow={page.missing?.kicker} title={page.missing?.title || 'Collection not found.'} body={page.missing?.copy} />
        <section className="category-pieces-section">
          <div className="container-custom">
            <CatEmpty block={{ title: 'Keep exploring.', primaryCta: page.missing?.primaryCta }} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="nx nx-page">
      {category && (
        <SeoHead
          title={category.seo?.title || pageTitle(category.name, brand)}
          description={category.seo?.description || category.description}
          keywords={category.seo?.keywords}
          image={category.seo?.ogImage || category.image}
          noIndex={category.seo?.noIndex}
        />
      )}
      <PageHero
       
        image={loading ? houseImage : heroImage}
        crumbs={crumbs}
        eyebrow={house?.roman ? `House ${house.roman}` : house?.name || category?.family}
        title={category?.name || ' '}
        body={category?.description}
        meta={loading ? [] : heroMeta(products.length)}
        actions={<StudioAction site={site} />}
      />

      {loading ? (
        <GridSkeleton />
      ) : (
        <ProductListing title={page.listTitle || 'Pieces'} products={products} empty={<CatEmpty block={page.empty} />}>
          <CollectionTiles inline eyebrow={page.moreEyebrow || 'Inside the house'} title={`${house?.name || category?.name || 'More'} collections`} items={more} />
        </ProductListing>
      )}
    </div>
  );
}
