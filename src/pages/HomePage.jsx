import { useCallback, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { useBootStore } from '../store/bootStore';
import SeoHead from '../components/SeoHead';
import useRefreshOnView from '../hooks/useRefreshOnView';
import {
  AnnounceBar,
  AtelierHero,
  BannerTiles,
  CuratedPieces,
  FaqList,
  Finale,
  Houses,
  JournalRow,
  Newsletter,
  PromiseStrip,
  PurposeRow,
  QuoteCarousel,
  RitualRow,
  SaleBand,
  StudioSplit,
  TrustRow,
} from '../components/home/atelier/Atelier';
import '../components/home/atelier/atelier.css';
import studioFallback from '../assets/home/finale-banner.jpg';
import finaleFallback from '../assets/home/footer-banner.jpg';

// The four product lists render as tabs of one "Curated pieces" section, placed where the
// first enabled list sits in the admin's Homepage layout.
const COLLECTION_KEYS = ['featured', 'bestsellers', 'new_arrivals', 'trending'];

export default function HomePage() {
  const home = useSite();
  const brand = useBrand();
  const [featured, setFeatured] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [beads, setBeads] = useState([]);
  const [rails, setRails] = useState({ bestsellers: [], newArrivals: [], trending: [] });
  const [faqs, setFaqs] = useState([]);
  const [banners, setBanners] = useState([]);
  const [flash, setFlash] = useState(null);
  const [flashProducts, setFlashProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const markPageReady = useBootStore((s) => s.markPageReady);

  const loadCatalog = useCallback(() => {
    return Promise.all([
      api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {}),
      api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {}),
      api.get('/customizer/beads').then(({ data }) => setBeads(data.beads || [])).catch(() => {}),
      api.get('/home/collections').then(({ data }) => setRails(data)).catch(() => {}),
      api.get('/faqs').then(({ data }) => setFaqs(data.faqs || [])).catch(() => {}),
      api.get('/banners?placement=home').then(({ data }) => setBanners(data.banners || [])).catch(() => {}),
      api.get('/flash-sales/active').then(({ data }) => {
        setFlash(data.sale);
        setFlashProducts(data.products || []);
      }).catch(() => {}),
      api.get('/blog').then(({ data }) => setPosts((data.posts || []).slice(0, 3))).catch(() => {}),
    ]).finally(() => markPageReady());
  }, [markPageReady]);

  useRefreshOnView(loadCatalog);

  const railCopy = home.rails || {};
  const flashCopy = home.flash || {};
  const voices = (home.testimonials || []).filter((v) => v.quote && v.name);
  const studioImage = home.studio?.bannerImage ? mediaUrl(home.studio.bannerImage) : studioFallback;
  const finaleImage = home.finale?.image ? mediaUrl(home.finale.image) : finaleFallback;

  const now = Date.now();
  const live = (key) => {
    const section = (home.homeLayout || []).find((s) => s.key === key);
    if (!section) return true;
    if (section.enabled === false) return false;
    if (section.startsAt && new Date(section.startsAt).getTime() > now) return false;
    if (section.endsAt && new Date(section.endsAt).getTime() < now) return false;
    return true;
  };

  const layout = (home.homeLayout || []).filter((s) => s.enabled !== false);
  const order = layout.length ? layout.map((s) => s.key) : [
    'hero', 'flash_sale', 'marquee', 'houses', 'studio', 'shop_by_purpose', 'ritual',
    'featured', 'bestsellers', 'new_arrivals', 'trending', 'testimonials', 'trust', 'faq', 'journal', 'newsletter', 'finale',
  ];

  const collectionTabs = [
    { key: 'featured', label: 'Featured', products: featured, to: home.featured?.to || '/shop', action: home.featured?.action },
    { key: 'bestsellers', label: railCopy.bestsellers?.title || 'Best sellers', products: rails.bestsellers, to: railCopy.bestsellers?.to || '/collection/best-sellers', action: railCopy.bestsellers?.action },
    { key: 'new_arrivals', label: railCopy.newArrivals?.title || 'New arrivals', products: rails.newArrivals, to: railCopy.newArrivals?.to || '/collection/new-arrivals', action: railCopy.newArrivals?.action },
    { key: 'trending', label: railCopy.trending?.title || 'Trending', products: rails.trending, to: railCopy.trending?.to || '/collection/trending', action: railCopy.trending?.action },
  ].filter((t) => live(t.key) && t.products?.length);
  const curatedAt = order.find((key) => collectionTabs.some((t) => t.key === key));
  const studioLive = live('studio');
  const heroFeature = featured[0] || rails.bestsellers?.[0];

  const blocks = {
    hero: live('hero') && (
      <div key="hero">
        <AtelierHero hero={home.hero} feature={heroFeature} />
        <BannerTiles banners={banners} />
      </div>
    ),
    flash_sale: live('flash_sale') && flash && <SaleBand key="flash_sale" sale={flash} products={flashProducts} copy={flashCopy} />,
    marquee: live('marquee') && <PromiseStrip key="marquee" items={home.marquee || []} />,
    houses: live('houses') && <Houses key="houses" copy={home.houses} />,
    studio: studioLive && <StudioSplit key="studio" studio={home.studio} ritual={home.ritual} image={studioImage} showSteps={live('ritual')} />,
    // The ritual steps are folded into the studio section; they stand alone only if the studio is off.
    ritual: live('ritual') && !studioLive && <RitualRow key="ritual" ritual={home.ritual} />,
    shop_by_purpose: live('shop_by_purpose') && <PurposeRow key="shop_by_purpose" copy={home.purpose} purposes={purposes.slice(0, 6)} beads={beads} />,
    testimonials: live('testimonials') && <QuoteCarousel key="testimonials" copy={home.voices} items={voices} />,
    trust: live('trust') && <TrustRow key="trust" copy={home.trust} claims={home.trustClaims || []} />,
    faq: live('faq') && <FaqList key="faq" copy={home.faq} faqs={faqs.slice(0, 5)} />,
    journal: live('journal') && <JournalRow key="journal" copy={home.journal} posts={posts} />,
    newsletter: live('newsletter') && <Newsletter key="newsletter" copy={home.newsletter} />,
    finale: live('finale') && <Finale key="finale" finale={home.finale} image={finaleImage} />,
  };
  for (const key of COLLECTION_KEYS) {
    blocks[key] = key === curatedAt && <CuratedPieces key="curated" copy={home.featured} tabs={collectionTabs} />;
  }

  return (
    <div className="home-page ma">
      <SeoHead
        title={pageTitle('', brand)}
        description={brand.seo?.description || home.hero?.subtitle}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage}
        noIndex={brand.seo?.noIndex}
      />
      {live('flash_sale') && <AnnounceBar sale={flash} copy={flashCopy} />}
      {order.map((key) => blocks[key]).filter(Boolean)}
    </div>
  );
}
