import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import { houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { BannerRow, CmsEmpty, CollectionTiles, GridSkeleton, PageHero, ProductListing, StudioBand } from '../components/home/nocturne/Listing';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

export default function CategoryPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.category;
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [houseProducts, setHouseProducts] = useState([]);
  const [banners, setBanners] = useState([]);
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
    api
      .get('/banners', { params: { placement: 'category' } })
      .then(({ data }) => alive && setBanners(data.banners || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  const house = houseMeta(site, category?.family);
  const houseImage = house?.image ? mediaUrl(house.image) : HOUSE_IMAGES[category?.family];
  const heroImage = category?.image ? mediaUrl(category.image) : products[0]?.images?.[0] ? mediaUrl(products[0].images[0]) : houseImage;
  const crumbs = [{ label: 'Home', to: '/' }, house ? { label: house.name, to: `/${house.slug}` } : { label: 'Shop all', to: '/shop' }, { label: category?.name || 'Collection' }];
  const ownBanners = banners.filter((b) => !b.link || String(b.link).includes(`/c/${slug}`));

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
        <PageHero image={HOUSE_IMAGES.crystals} crumbs={[{ label: 'Home', to: '/' }, { label: 'Not found' }]} eyebrow={page.missing?.kicker} title={page.missing?.title || 'Collection not found.'} body={page.missing?.copy} size="short" />
        <div className="nx-w nx-sec">
          <CmsEmpty block={{ ...page.missing, title: 'Keep exploring.', copy: '' }} />
        </div>
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
        size="short"
        image={loading ? houseImage : heroImage}
        crumbs={crumbs}
        eyebrow={house?.name || category?.family}
        title={category?.name || ' '}
        body={category?.description}
        meta={loading ? [] : [`${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`]}
        actions={
          page.to && (
            <Link to={page.to} className="nx-lnk">
              {clean(page.action) || 'Customization'} →
            </Link>
          )
        }
      />

      <BannerRow banners={ownBanners} />

      {loading ? (
        <GridSkeleton />
      ) : (
        <ProductListing eyebrow={house?.name ? `${house.name} · collection` : 'Collection'} title="The pieces" products={products} empty={<CmsEmpty block={page.empty} />} />
      )}

      <CollectionTiles eyebrow="More from this house" title={house ? `More ${house.name.toLowerCase()}` : 'More collections'} items={more} />

      <StudioBand body="Choose a purpose and an intention; the crystals are selected for you and strung to your wrist." to={page.to || '/customize'} cta={clean(page.action) || 'Open the studio'} />
    </div>
  );
}
