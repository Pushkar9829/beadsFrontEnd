import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { useBootStore } from '../store/bootStore';
import SeoHead from '../components/SeoHead';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { formatInr } from '../lib/format';
import { NFinale, NJournal, NLook, NPurposes } from '../components/home/nocturne/Nocturne';
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
import finaleFallback from '../assets/home/finale-banner.jpg';

const DEFAULT_ORDER = ['hero', 'facts', 'houses', 'collection', 'flash_sale', 'kundali', 'look', 'finder', 'purposes', 'craft', 'reviews', 'promises', 'journal', 'newsletter', 'finale'];

/** Sections still in the Nocturne design keep its scoped styles. */
function Nx({ children }) {
  return <div className="nx">{children}</div>;
}

/** Product slugs referenced by the CMS (hero hotspots and shop-the-look points). */
function referencedSlugs(home) {
  const slugs = new Set();
  [home.hero, ...(home.hero?.slides || [])].forEach((s) => s?.hotspot?.productSlug && slugs.add(s.hotspot.productSlug));
  (home.look?.looks || []).forEach((l) => (l.items || []).forEach((it) => it.productSlug && slugs.add(it.productSlug)));
  return [...slugs].slice(0, 24);
}

export default function HomePage() {
  const home = useSite();
  const brand = useBrand();
  const [featured, setFeatured] = useState([]);
  const [rails, setRails] = useState({ bestsellers: [], newArrivals: [], trending: [] });
  const [purposes, setPurposes] = useState([]);
  const [beads, setBeads] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [flash, setFlash] = useState(null);
  const [flashProducts, setFlashProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [linked, setLinked] = useState({});
  const markPageReady = useBootStore((s) => s.markPageReady);

  const slugKey = referencedSlugs(home).join(',');

  const loadCatalog = useCallback(() => {
    return Promise.all([
      api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {}),
      api.get('/home/collections').then(({ data }) => setRails(data)).catch(() => {}),
      api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {}),
      api.get('/customizer/beads').then(({ data }) => setBeads(data.beads || [])).catch(() => {}),
      api.get('/faqs').then(({ data }) => setFaqs(data.faqs || [])).catch(() => {}),
      api.get('/flash-sales/active').then(({ data }) => {
        setFlash(data.sale);
        setFlashProducts(data.products || []);
      }).catch(() => {}),
      api.get('/blog').then(({ data }) => setPosts((data.posts || []).slice(0, 3))).catch(() => {}),
      api.get('/home/summary').then(({ data }) => setSummary(data)).catch(() => {}),
    ]).finally(() => markPageReady());
  }, [markPageReady]);

  useRefreshOnView(loadCatalog);

  // Products picked in the CMS (hero hotspots, shop-the-look points); the content loads separately.
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

  const railCopy = home.rails || {};
  const tabs = [
    { key: 'featured', label: 'Featured', products: featured, to: home.featured?.to || '/shop', action: home.featured?.action },
    { key: 'bestsellers', label: railCopy.bestsellers?.title || 'Best sellers', products: rails.bestsellers, to: railCopy.bestsellers?.to, action: railCopy.bestsellers?.action },
    { key: 'new', label: railCopy.newArrivals?.title || 'New arrivals', products: rails.newArrivals, to: railCopy.newArrivals?.to, action: railCopy.newArrivals?.action },
    { key: 'trending', label: railCopy.trending?.title || 'Trending', products: rails.trending, to: railCopy.trending?.to, action: railCopy.trending?.action },
  ];

  const blocks = {
    hero: live('hero') && <AHero key="hero" hero={home.hero} products={linked} />,
    facts: live('facts') && <AValueBar key="facts" items={home.facts?.items || []} vars={vars} />,
    houses: live('houses') && <AHouses key="houses" houses={home.houses} studio={home.studio} counts={summary?.houses || {}} />,
    collection: live('collection') && <ACollection key="collection" copy={home.featured} tabs={tabs} />,
    flash_sale: live('flash_sale') && flash && <AFlash key="flash_sale" sale={flash} products={flashProducts} copy={home.flash} />,
    kundali: live('kundali') && <AKundali key="kundali" copy={home.kundali} />,
    look: live('look') && <Nx key="look"><NLook copy={home.look} products={linked} /></Nx>,
    finder: live('finder') && <AFinder key="finder" copy={home.finder} purposes={purposes} />,
    purposes: live('purposes') && <Nx key="purposes"><NPurposes copy={home.purpose} purposes={purposes} beads={beads} /></Nx>,
    craft: live('craft') && <ACraft key="craft" copy={home.craft} image={home.craft?.image ? mediaUrl(home.craft.image) : craftFallback} />,
    reviews: live('reviews') && (
      <AReviews key="reviews" copy={home.reviews} voices={home.voices} testimonials={home.testimonials || []} faqs={faqs} faqCopy={home.faq} rating={summary?.rating} />
    ),
    promises: live('promises') && <APromises key="promises" claims={home.trustClaims || []} />,
    journal: live('journal') && <Nx key="journal"><NJournal copy={home.journal} posts={posts} /></Nx>,
    newsletter: live('newsletter') && <ANewsletter key="newsletter" copy={home.newsletter} />,
    finale: live('finale') && (
      <Nx key="finale">
        <NFinale finale={home.finale} image={home.finale?.image ? mediaUrl(home.finale.image) : finaleFallback} />
      </Nx>
    ),
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
