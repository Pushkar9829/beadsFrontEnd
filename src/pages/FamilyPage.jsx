import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api, { mediaUrl } from '../api/client';
import { fillCopy, houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import SeoHead from '../components/SeoHead';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CollectionTiles, EmptyBlock, PageHero, ProductListing, StudioBand } from '../components/home/nocturne/Listing';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

/** CMS empty block → Nocturne empty state. */
export function CmsEmpty({ block }) {
  if (!block?.title) return null;
  return (
    <EmptyBlock
      title={block.title}
      body={block.copy}
      actions={
        <>
          {block.primaryCta?.label && (
            <Link to={block.primaryCta.to || '/'} className="nx-btn">
              {clean(block.primaryCta.label)}
            </Link>
          )}
          {block.secondaryCta?.label && (
            <Link to={block.secondaryCta.to || '/'} className="nx-btn nx-btn-o">
              {clean(block.secondaryCta.label)}
            </Link>
          )}
        </>
      }
    />
  );
}

export default function FamilyPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.family;
  const family = useLocation().pathname.replace(/^\//, '').replace(/\/$/, '');
  const meta = houseMeta(site, family);
  const [tree, setTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.get('/categories', { params: { family } }), api.get('/products', { params: { family } })])
      .then(([c, p]) => {
        if (!alive) return;
        setTree(c.data.tree || []);
        setProducts(p.data.products || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [family]);

  const title = meta?.name || family;
  const heroImage = meta?.image ? mediaUrl(meta.image) : HOUSE_IMAGES[family];
  const children = useMemo(() => tree[0]?.children || [], [tree]);

  // Count products and borrow a photo for each sub-collection (categories have no image of their own).
  const subs = useMemo(
    () =>
      children.map((c) => {
        const inCat = products.filter((p) => (p.categoryId?.slug || p.categoryId) === c.slug || String(p.categoryId?._id || p.categoryId) === String(c._id));
        const studio = c.slug === 'customize-your-bracelet';
        return {
          key: c._id,
          to: studio ? '/customize' : `/c/${c.slug}`,
          title: c.name,
          body: c.description,
          image: c.image ? mediaUrl(c.image) : inCat[0]?.images?.[0] ? mediaUrl(inCat[0].images[0]) : heroImage,
          count: studio ? null : inCat.length,
          kicker: studio ? 'Studio' : undefined,
        };
      }),
    [children, products, heroImage]
  );

  const chips = useMemo(
    () =>
      children
        .map((c) => ({ value: c.slug, label: c.name, count: products.filter((p) => p.categoryId?.slug === c.slug).length }))
        .filter((c) => c.count > 0),
    [children, products]
  );
  const filterBy = useCallback((p, slug) => p.categoryId?.slug === slug, []);
  const piecesBody = fillCopy(page.piecesBody, { count: products.length, pieces: products.length === 1 ? 'piece' : 'pieces' });

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(title, brand)} description={meta?.blurb} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
        image={heroImage}
        crumbs={[{ label: 'Home', to: '/' }, { label: title }]}
        eyebrow={meta?.roman ? `House ${meta.roman}` : 'The house'}
        title={title}
        body={meta?.blurb}
        meta={loading ? [] : [`${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`, children.length ? `${children.length} collections` : null].filter(Boolean)}
        actions={
          page.shopTo && (
            <Link to={page.shopTo} className="nx-lnk">
              {clean(page.shopAction) || 'Shop all'} →
            </Link>
          )
        }
      />

      <CollectionTiles eyebrow={`Inside the house`} title={`${title} collections`} items={subs} />

      {loading ? (
        <div className="nx-w nx-sec">
          <div className="nx-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="nx-skel" />
            ))}
          </div>
        </div>
      ) : (
        <ProductListing
          eyebrow={page.piecesEyebrow}
          title={page.piecesTitle ? `${page.piecesTitle}` : 'Pieces'}
          products={products}
          chips={chips}
          filterBy={filterBy}
          empty={<CmsEmpty block={page.empty} />}
        />
      )}
      {!loading && products.length > 0 && piecesBody && <p className="sr-only">{piecesBody}</p>}

      <StudioBand
        title="Compose your own strand."
        body="Choose a purpose and an intention; the crystals are selected for you and strung to your wrist."
        to={page.piecesTo || '/customize'}
        cta={clean(page.piecesAction) || 'Open the studio'}
      />
      <div className="nx-w nx-back">
        <Link to="/" className="nx-lnk">
          <ArrowRight size={13} style={{ transform: 'rotate(180deg)', display: 'inline', verticalAlign: '-2px' }} /> Back to all houses
        </Link>
      </div>
    </div>
  );
}
