import { useCallback, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES, useCountdown } from '../components/home/nocturne/Nocturne';
import { CmsEmpty, EmptyBlock, GridSkeleton, PageHero, ProductListing } from '../components/home/nocturne/Listing';

const pad = (n) => String(n).padStart(2, '0');

function Clock({ endsAt }) {
  const t = useCountdown(endsAt);
  if (!t || t.done) return null;
  return (
    <div className="nx-clock" role="timer" aria-label="Time left">
      {[
        [t.d, 'Days'],
        [pad(t.h), 'Hours'],
        [pad(t.m), 'Min'],
        [pad(t.s), 'Sec'],
      ].map(([v, l]) => (
        <span key={l}>
          <b>{v}</b>
          {l}
        </span>
      ))}
    </div>
  );
}

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

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(sale?.name || label, brand)} description={copy.pageBody || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      {loading ? (
        <>
          <PageHero size="short" crumbs={crumbs} eyebrow={label} title=" " />
          <GridSkeleton />
        </>
      ) : !sale ? (
        <>
          <PageHero size="short" image={copy.pageImage ? mediaUrl(copy.pageImage) : HOUSE_IMAGES.gemstones} crumbs={crumbs} eyebrow={label} title={copy.emptyTitle || 'No sale is running.'} body={copy.emptyBody || copy.pageBody} />
          <div className="nx-w nx-sec">
            <CmsEmpty block={{ title: 'Keep exploring.', primaryCta: { label: 'Shop all', to: '/shop' }, secondaryCta: { label: 'Customization', to: '/customize' } }} />
          </div>
        </>
      ) : (
        <>
          <PageHero size="short" image={image} crumbs={crumbs} eyebrow={label} title={sale.name} body={copy.pageBody || copy.body} actions={<Clock endsAt={sale.endsAt} />} />
          {products.length === 0 ? (
            <div className="nx-w nx-sec">
              <EmptyBlock title={copy.emptyProducts || 'Products for this sale are being placed.'} />
            </div>
          ) : (
            <ProductListing eyebrow="On the tray" title="Timed prices" products={products} />
          )}
        </>
      )}
    </div>
  );
}
