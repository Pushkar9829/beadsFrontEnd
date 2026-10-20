// Flash sale: the source renders this as CategoryPage houseId="flash-sale" (hero, cream pieces
// section, "Inside the house" tiles). The live sale and its products come from /flash-sales/active.
import { useCallback, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CatEmpty, CollectionTiles, GridSkeleton, heroMeta, houseTiles, PageHero, ProductListing, StudioAction } from '../components/home/nocturne/Listing';

export default function FlashSalePage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.flash || {};
  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api
      .get('/flash-sales/active')
      .then(({ data }) => {
        setSale(data.sale);
        setProducts(data.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const label = copy.label || 'Flash sale';
  const crumbs = [{ label: 'Home', to: '/' }, { label }];
  const image = copy.pageImage ? mediaUrl(copy.pageImage) : products[0]?.images?.[0] ? mediaUrl(products[0].images[0]) : HOUSE_IMAGES.gemstones;
  const title = loading ? ' ' : sale ? sale.name : copy.emptyTitle || 'No sale is running.';
  const body = sale ? copy.pageBody || copy.body : copy.emptyBody || copy.pageBody;
  const empty = sale ? { title: copy.emptyProducts || 'Products for this sale are being placed.' } : { title: 'Keep exploring.', primaryCta: { label: 'Shop all', to: '/shop' } };

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(sale?.name || label, brand)} description={copy.pageBody || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero image={loading ? null : image} crumbs={crumbs} eyebrow={label} title={title} body={loading ? null : body} meta={loading ? [] : heroMeta(products.length)} actions={<StudioAction site={site} />} />
      {loading ? (
        <GridSkeleton />
      ) : (
        <ProductListing eyebrow={copy.listEyebrow} title={copy.listTitle || 'Pieces'} products={products} empty={<CatEmpty block={empty} />}>
          <CollectionTiles inline eyebrow="Inside the house" title={`${sale?.name || label} collections`} items={houseTiles(site)} />
        </ProductListing>
      )}
    </div>
  );
}
