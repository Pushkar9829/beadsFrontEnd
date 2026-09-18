import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Hero from '../components/home/Hero';
import SectionHead from '../components/home/SectionHead';
import RitualSteps from '../components/home/RitualSteps';
import HousesRow from '../components/home/HousesRow';
import Testimonials from '../components/home/Testimonials';
import FaqAccordion from '../components/home/FaqAccordion';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reveal from '../components/ui/Reveal';
import InViewGroup from '../components/ui/InViewGroup';
import { claimIcon } from '../lib/claimIcons';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { useBootStore } from '../store/bootStore';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../components/customizer/PurposeGrid';
import finaleBanner from '../assets/home/finale-banner.jpg';
import studioBanner from '../assets/home/hero-bracelet.jpg';
import NewsletterBox from '../components/NewsletterBox';
import FlashCountdown from '../components/FlashCountdown';
import FlashSaleMark from '../components/ui/FlashSaleMark';
import SeoHead from '../components/SeoHead';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function HomePage() {
  const home = useSite();
  const brand = useBrand();
  const [featured, setFeatured] = useState([]);
  const [purposes, setPurposes] = useState([]);
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

  const studioPurposes = purposes.slice(0, 6);
  const marquee = home.marquee;
  const claims = home.trustClaims;
  const studioImage = home.studio.bannerImage ? mediaUrl(home.studio.bannerImage) : studioBanner;
  const finaleImage = home.finale.image ? mediaUrl(home.finale.image) : finaleBanner;
  const purposeCopy = home.purpose || {};
  const railCopy = home.rails || {};
  const faqCopy = home.faq || {};
  const journalCopy = home.journal || {};
  const flashCopy = home.flash || {};
  const newsletterCopy = home.newsletter || {};
  const voices = (home.testimonials || []).filter((v) => v.quote && v.name);

  const layout = (home.homeLayout || []).filter((s) => s.enabled !== false);
  const now = Date.now();
  const live = (key) => {
    const section = (home.homeLayout || []).find((s) => s.key === key);
    if (!section) return true;
    if (section.enabled === false) return false;
    if (section.startsAt && new Date(section.startsAt).getTime() > now) return false;
    if (section.endsAt && new Date(section.endsAt).getTime() < now) return false;
    return true;
  };

  function ProductRail({ title, eyebrow, products, to, action }) {
    if (!products?.length) return null;
    return (
      <section className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={eyebrow} title={title} to={to} action={action || 'See all →'} />
        </Reveal>
        <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <div key={p._id} className="feature-item" style={{ '--i': i }}>
              <ProductCard product={p} description={p.shortDescription} />
            </div>
          ))}
        </InViewGroup>
      </section>
    );
  }

  const blocks = {
    hero: live('hero') && (
      <div key="hero">
        <Hero hero={home.hero} />
        {banners.length > 0 && (
          <div className="shell">
            <div className={`home-banners home-banners-${Math.min(2, banners.length)}`}>
              {banners.slice(0, 2).map((b) => (
                <Link key={b._id} to={b.link || '/shop'} className="home-banner">
                  <img src={mediaUrl(b.mobileImage || b.image)} alt="" className="home-banner-img" />
                  {b.title && <span className="home-banner-label">{b.title}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    flash_sale: live('flash_sale') && flash && (
      <section key="flash_sale" className="shell flash-home">
        <Reveal variant="head">
          <SectionHead
            eyebrow={<FlashSaleMark size="md" label={flashCopy.label || 'Flash sale'} />}
            title={flash.name}
            body={flashCopy.body}
            to={flashCopy.to || '/sale'}
            action={flashCopy.action || 'Shop the sale →'}
            aside={<FlashCountdown sale={flash} to={null} compact />}
          />
        </Reveal>
        {flashProducts.length > 0 && (
          <InViewGroup className={`feature-grid flash-products flash-products-${Math.min(4, flashProducts.length)}`}>
            {flashProducts.slice(0, 4).map((p, i) => (
              <div key={p._id} className="feature-item h-full min-w-0" style={{ '--i': i }}>
                <ProductCard product={p} description={p.shortDescription} />
              </div>
            ))}
          </InViewGroup>
        )}
      </section>
    ),
    marquee: live('marquee') && marquee.length > 0 && (
      <div key="marquee" className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...marquee, ...marquee].map((item, i) => (
            <span key={`${item}-${i}`} className="marquee-item">
              {item}
              <span className="marquee-dot" />
            </span>
          ))}
        </div>
      </div>
    ),
    houses: live('houses') && (
      <section key="houses" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.houses.eyebrow} title={home.houses.title} body={home.houses.body} />
        </Reveal>
        <HousesRow houses={home.houses.items} />
      </section>
    ),
    studio: live('studio') && (
      <section key="studio" className="relative py-8 sm:py-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell">
          <Reveal variant="head">
            <SectionHead eyebrow={home.studio.eyebrow} title={home.studio.title} body={home.studio.body} to={home.studio.to} action={home.studio.action} />
          </Reveal>
          <Link to={home.studio.to || '/customize'} className="studio-invite mt-8 group block overflow-hidden sm:mt-10">
            <div className="studio-invite-media" aria-hidden>
              <img src={studioImage} alt="" />
            </div>
            <div className="studio-invite-copy">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{home.studio.kicker}</p>
              <h3 className="mt-2 font-serif text-xl gold-text sm:text-2xl">{home.studio.heading}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-lilac">{home.studio.copy}</p>
              <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-gold transition group-hover:translate-x-1">{home.studio.cta}</span>
            </div>
          </Link>
        </div>
      </section>
    ),
    ritual: live('ritual') && (
      <section key="ritual" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.ritual.eyebrow} title={home.ritual.title} body={home.ritual.body} />
        </Reveal>
        <RitualSteps steps={home.ritual.steps} />
      </section>
    ),
    featured: live('featured') && featured.length > 0 && (
      <section key="featured" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.featured.eyebrow} title={home.featured.title} body={home.featured.body} to={home.featured.to} action={home.featured.action} />
        </Reveal>
        <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {featured.map((p, i) => (
            <div key={p._id} className="feature-item" style={{ '--i': i }}>
              <ProductCard product={p} description={p.shortDescription} />
            </div>
          ))}
        </InViewGroup>
      </section>
    ),
    shop_by_purpose: live('shop_by_purpose') && studioPurposes.length > 0 && (
      <section key="shop_by_purpose" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead
            eyebrow={purposeCopy.eyebrow}
            title={purposeCopy.title}
            body={purposeCopy.body}
            to={purposeCopy.to || '/customize/purpose'}
            action={purposeCopy.action}
          />
        </Reveal>
        <div className="purpose-pick mt-8">
          {studioPurposes.map((p) => (
            <Link key={p._id || p.slug} to={`/customize?path=purpose&purpose=${p.slug}`} className="purpose-pick-card" style={purposeToneStyle(p)}>
              <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
                <PurposeIcon purpose={p} />
              </span>
              <span className="purpose-pick-copy">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>
    ),
    bestsellers: live('bestsellers') && (
      <ProductRail
        key="bestsellers"
        eyebrow={railCopy.bestsellers?.eyebrow}
        title={railCopy.bestsellers?.title}
        action={railCopy.bestsellers?.action}
        products={rails.bestsellers}
        to={railCopy.bestsellers?.to || '/collection/best-sellers'}
      />
    ),
    new_arrivals: live('new_arrivals') && (
      <ProductRail
        key="new_arrivals"
        eyebrow={railCopy.newArrivals?.eyebrow}
        title={railCopy.newArrivals?.title}
        action={railCopy.newArrivals?.action}
        products={rails.newArrivals}
        to={railCopy.newArrivals?.to || '/collection/new-arrivals'}
      />
    ),
    trending: live('trending') && (
      <ProductRail
        key="trending"
        eyebrow={railCopy.trending?.eyebrow}
        title={railCopy.trending?.title}
        action={railCopy.trending?.action}
        products={rails.trending}
        to={railCopy.trending?.to || '/collection/trending'}
      />
    ),
    testimonials: live('testimonials') && voices.length > 0 && (
      <section key="testimonials" className="relative py-8 sm:py-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell">
          <Reveal variant="head">
            <SectionHead eyebrow={home.voices.eyebrow} title={home.voices.title} body={home.voices.body} />
          </Reveal>
          <Testimonials items={home.testimonials} />
        </div>
      </section>
    ),
    trust: live('trust') && claims.length > 0 && (
      <section key="trust" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.trust.eyebrow} title={home.trust.title} body={home.trust.body} />
        </Reveal>
        <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {claims.map((c, i) => {
            const Icon = claimIcon(c);
            return (
              <div key={`${c.title}-${i}`} className="trust-item" style={{ '--i': i }}>
                <article className="trust-card h-full p-4">
                  <Icon size={16} className="text-gold" />
                  <h3 className="mt-4 font-serif text-lg text-gold-light">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lilac">{c.body}</p>
                </article>
              </div>
            );
          })}
        </InViewGroup>
      </section>
    ),
    faq: live('faq') && faqs.length > 0 && (
      <section key="faq" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={faqCopy.eyebrow} title={faqCopy.title} to={faqCopy.to || '/faq'} action={faqCopy.action} />
        </Reveal>
        <FaqAccordion items={faqs.slice(0, 4)} />
      </section>
    ),
    journal: live('journal') && posts.length > 0 && (
      <section key="journal" className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={journalCopy.eyebrow} title={journalCopy.title} to={journalCopy.to || '/journal'} action={journalCopy.action} />
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p._id} to={`/journal/${p.slug}`} className="rounded-2xl border border-gold/20 bg-surface p-5 transition hover:border-gold/40">
              {p.image && <img src={mediaUrl(p.image)} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" />}
              <h3 className="font-serif text-lg gold-text">{p.title}</h3>
              {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-lilac">{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    ),
    newsletter: live('newsletter') && (
      <section key="newsletter" className="shell py-8">
        <NewsletterBox eyebrow={newsletterCopy.eyebrow} title={newsletterCopy.title} />
      </section>
    ),
    finale: live('finale') && (
      <section key="finale" className="shell pb-8 pt-6 md:py-12">
        <InViewGroup className="finale-stage">
          <div className="finale text-center">
            <div className="finale-media" aria-hidden>
              <img src={finaleImage} alt="" />
            </div>
            <div className="relative z-10 px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
              {home.finale.kicker && <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{home.finale.kicker}</p>}
              <h2 className="finale-title mt-3 font-serif text-xl gold-text sm:text-2xl md:text-3xl">{home.finale.title}</h2>
              {home.finale.copy && <p className="finale-copy mx-auto mt-4 max-w-xl text-sm text-lilac sm:text-base">{home.finale.copy}</p>}
              <div className="finale-actions mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:mt-8">
                {home.finale.primaryCta?.label && <Button to={home.finale.primaryCta.to || '/customize'} className="w-full min-[420px]:w-auto">{home.finale.primaryCta.label}</Button>}
                {home.finale.secondaryCta?.label && <Button to={home.finale.secondaryCta.to || '/shop'} variant="ghost" className="w-full min-[420px]:w-auto">{home.finale.secondaryCta.label}</Button>}
              </div>
            </div>
          </div>
        </InViewGroup>
      </section>
    ),
  };

  const ordered = (layout.length ? layout : Object.keys(blocks).map((key) => ({ key }))).map((s) => blocks[s.key]).filter(Boolean);

  return (
    <div className="home-page">
      <SeoHead
        title={pageTitle('', brand)}
        description={brand.seo?.description || home.hero?.subtitle}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage}
        noIndex={brand.seo?.noIndex}
      />
      {ordered}
    </div>
  );
}
