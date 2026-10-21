import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { useBootStore } from '../store/bootStore';
import SeoHead from '../components/SeoHead';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { formatInr } from '../lib/format';
import {
  ACollection,
  ACraft,
  AFinder,
  AFlash,
  AHero,
  AHouses,
  AKundali,
  ANewsletter,
  APromises,
  AReviews,
  AValueBar,
} from '../components/home/atelier/AtelierHome';
import '../components/home/nocturne/nocturne.css';
import craftFallback from '../assets/home/house-rudraksha.jpg';

// Same sections and order as the source home page (beeds_ecommerce HomePage.jsx).
const DEFAULT_ORDER = ['hero', 'facts', 'houses', 'collection', 'flash_sale', 'kundali', 'finder', 'craft', 'reviews', 'promises', 'newsletter'];

/** Product slugs referenced by the CMS (hero hotspots). */
function referencedSlugs(home) {
  const slugs = new Set();
  [home.hero, ...(home.hero?.slides || [])].forEach((s) => s?.hotspot?.productSlug && slugs.add(s.hotspot.productSlug));
  return [...slugs].slice(0, 24);
}

export default function HomePage() {
  const home = useSite();
  const brand = useBrand();
  const [featured, setFeatured] = useState([]);
  const [newIn, setNewIn] = useState([]);
  const [under, setUnder] = useState([]);
  const underPrice = Number(home.featured?.underPrice) > 0 ? Number(home.featured.underPrice) : 1500;
  const [purposes, setPurposes] = useState([]);
  const [flash, setFlash] = useState(null);
  const [flashProducts, setFlashProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [linked, setLinked] = useState({});
  const markPageReady = useBootStore((s) => s.markPageReady);

  const slugKey = referencedSlugs(home).join(',');

  const loadCatalog = useCallback(() => {
    return Promise.all([
      api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {}),
      // New In tab: the "new-arrivals" collection. When that collection is missing or switched off,
      // /home/collections supplies the same rule-based fallback (its best-seller and trending rails are not shown).
      api
        .get('/collections/new-arrivals')
        .then(({ data }) => setNewIn(data.products || []))
        .catch(() => api.get('/home/collections').then(({ data }) => setNewIn(data.newArrivals || [])))
        .catch(() => {}),
      api.get('/products', { params: { maxPrice: underPrice, limit: 12, page: 1 } }).then(({ data }) => setUnder(data.products || [])).catch(() => {}),
      api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {}),
      api.get('/flash-sales/active').then(({ data }) => {
        setFlash(data.sale);
        setFlashProducts(data.products || []);
      }).catch(() => {}),
      api.get('/home/summary').then(({ data }) => setSummary(data)).catch(() => {}),
    ]).finally(() => markPageReady());
  }, [markPageReady, underPrice]);

  useRefreshOnView(loadCatalog);

  // Products picked in the CMS (hero hotspots); the content loads separately.
  useEffect(() => {
    if (!slugKey) return undefined;
    let alive = true;
    api
      .get('/products', { params: { slugs: slugKey } })
      .then(({ data }) => alive && setLinked(Object.fromEntries((data.products || []).map((p) => [p.slug, p]))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slugKey]);

  const now = Date.now();
  const live = (key) => {
    const section = (home.homeLayout || []).find((s) => s.key === key);
    if (!section) return true;
    if (section.enabled === false) return false;
    if (section.startsAt && new Date(section.startsAt).getTime() > now) return false;
    if (section.endsAt && new Date(section.endsAt).getTime() < now) return false;
    return true;
  };
  const layout = (home.homeLayout || []).filter((s) => s.enabled !== false).map((s) => s.key);
  const order = layout.length ? layout : DEFAULT_ORDER;

  // Live numbers for {tokens} in the facts strip.
  const vars = useMemo(
    () => ({
      stones: summary?.stones || null,
      purposes: summary?.purposes || null,
      products: summary?.products || null,
      minPrice: summary?.minPrice ? formatInr(summary.minPrice) : null,
      rating: summary?.rating?.average ? Number(summary.rating.average).toFixed(1) : null,
      reviews: summary?.rating?.count ? (summary.rating.count >= 100 ? `${Math.floor(summary.rating.count / 100) * 100}+` : String(summary.rating.count)) : null,
    }),
    [summary]
  );

  // Same three tabs as the source home: Featured · New In · Under ₹1,500.
  const fc = home.featured || {};
  const tabs = [
    { key: 'featured', label: fc.tabFeatured || 'Featured', products: featured },
    { key: 'new', label: fc.tabNew || 'New In', products: newIn },
    { key: 'under', label: String(fc.tabUnder || 'Under {price}').replace('{price}', formatInr(underPrice)), products: under },
  ];

  // The value bar (facts) sits inside the hero section, as in the source; on its own only when the hero is off.
  const valueBar = live('facts') && <AValueBar key="facts" items={home.facts?.items || []} vars={vars} />;
  const blocks = {
    hero: live('hero') && (
      <AHero key="hero" hero={home.hero} products={linked}>
        {valueBar}
      </AHero>
    ),
    facts: !live('hero') && valueBar,
    houses: live('houses') && <AHouses key="houses" houses={home.houses} studio={home.studio} counts={summary?.houses || {}} />,
    collection: live('collection') && <ACollection key="collection" copy={home.featured} tabs={tabs} />,
    flash_sale: live('flash_sale') && flash && <AFlash key="flash_sale" sale={flash} products={flashProducts} copy={home.flash} />,
    kundali: live('kundali') && <AKundali key="kundali" copy={home.kundali} />,
    finder: live('finder') && <AFinder key="finder" copy={home.finder} purposes={purposes} />,
    craft: live('craft') && <ACraft key="craft" copy={home.craft} image={home.craft?.image ? mediaUrl(home.craft.image) : craftFallback} />,
    reviews: live('reviews') && (
      <AReviews key="reviews" copy={home.reviews} voices={home.voices} testimonials={home.testimonials || []} rating={summary?.rating} />
    ),
    promises: live('promises') && <APromises key="promises" claims={home.trustClaims || []} />,
    newsletter: live('newsletter') && <ANewsletter key="newsletter" copy={home.newsletter} />,
  };

  return (
    <div className="homepage-root">
      <SeoHead
        title={pageTitle('', brand)}
        description={brand.seo?.description || home.hero?.subtitle}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage}
        noIndex={brand.seo?.noIndex}
      />
      {order.map((key) => blocks[key]).filter(Boolean)}
    </div>
  );
}
