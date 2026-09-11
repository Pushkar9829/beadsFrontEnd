import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Hero from '../components/home/Hero';
import SectionHead from '../components/home/SectionHead';
import RitualSteps from '../components/home/RitualSteps';
import HousesRow from '../components/home/HousesRow';
import Testimonials from '../components/home/Testimonials';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reveal from '../components/ui/Reveal';
import InViewGroup from '../components/ui/InViewGroup';
import { claimIcon } from '../lib/claimIcons';
import { useSite } from '../store/contentStore';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../components/customizer/PurposeGrid';
import finaleBanner from '../assets/home/finale-banner.jpg';
import studioBanner from '../assets/home/hero-bracelet.jpg';

const FALLBACK_PURPOSES = [
  { slug: 'love-relationships', name: 'Love & Relationships', description: 'Invite tenderness, partnership and self-worth.' },
  { slug: 'money-abundance', name: 'Money & Abundance', description: 'Align with wealth, flow and material ease.' },
  { slug: 'career-success', name: 'Career & Success', description: 'Support ambition, recognition and skilled work.' },
  { slug: 'confidence-power', name: 'Confidence & Power', description: 'Stand in your voice, will and presence.' },
  { slug: 'protection-grounding', name: 'Protection & Grounding', description: 'Feel held, bounded and rooted.' },
  { slug: 'calm-emotional-balance', name: 'Calm & Emotional Balance', description: 'Soften intensity and restore evenness.' },
];

export default function HomePage() {
  const home = useSite();
  const [featured, setFeatured] = useState([]);
  const [purposes, setPurposes] = useState([]);

  useEffect(() => {
    api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {});
    api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {});
  }, []);
  const studioPurposes = (purposes.length ? purposes : FALLBACK_PURPOSES).slice(0, 6);
  const marquee = home.marquee;
  const claims = home.trustClaims;
  const studioImage = home.studio.bannerImage ? mediaUrl(home.studio.bannerImage) : studioBanner;
  const finaleImage = home.finale.image ? mediaUrl(home.finale.image) : finaleBanner;

  return (
    <div className="home-page">
      <Hero hero={home.hero} />

      {marquee.length > 0 && (
        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {[...marquee, ...marquee].map((item, i) => (
              <span key={`${item}-${i}`} className="marquee-item">
                {item}
                <span className="marquee-dot" />
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.houses.eyebrow} title={home.houses.title} body={home.houses.body} />
        </Reveal>
        <HousesRow houses={home.houses.items} />
      </section>

      <section className="relative py-8 sm:py-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell">
          <Reveal variant="head">
            <SectionHead
              eyebrow={home.studio.eyebrow}
              title={home.studio.title}
              body={home.studio.body}
              to={home.studio.to}
              action={home.studio.action}
            />
          </Reveal>

          <Link to={home.studio.to || '/customize'} className="studio-invite mt-8 group block overflow-hidden sm:mt-10">
            <div className="studio-invite-media" aria-hidden>
              <img src={studioImage} alt="" />
            </div>
            <div className="studio-invite-copy">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{home.studio.kicker}</p>
              <h3 className="mt-2 font-serif text-xl gold-text sm:text-2xl">{home.studio.heading}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-lilac">
                {home.studio.copy}
              </p>
              <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-gold transition group-hover:translate-x-1">
                {home.studio.cta}
              </span>
            </div>
          </Link>

          <div className="purpose-pick mt-6 sm:mt-8">
            {studioPurposes.map((p) => (
              <Link
                key={p._id || p.slug}
                to={`/customize?purpose=${p.slug}`}
                className="purpose-pick-card"
                style={purposeToneStyle(p)}
              >
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
        </div>
      </section>

      <section className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead eyebrow={home.ritual.eyebrow} title={home.ritual.title} body={home.ritual.body} />
        </Reveal>
        <RitualSteps steps={home.ritual.steps} />
      </section>

      {featured.length > 0 && (
        <section className="shell py-8 sm:py-10 md:py-14">
          <Reveal variant="head">
            <SectionHead
              eyebrow={home.featured.eyebrow}
              title={home.featured.title}
              body={home.featured.body}
              to={home.featured.to}
              action={home.featured.action}
            />
          </Reveal>
          <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {featured.map((p, i) => (
              <div key={p._id} className="feature-item" style={{ '--i': i }}>
                <ProductCard product={p} description={p.shortDescription} />
              </div>
            ))}
          </InViewGroup>
        </section>
      )}

      <section className="relative py-8 sm:py-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell">
          <Reveal variant="head">
            <SectionHead eyebrow={home.voices.eyebrow} title={home.voices.title} body={home.voices.body} />
          </Reveal>
          <Testimonials items={home.testimonials} />
        </div>
      </section>

      {claims.length > 0 && (
        <section className="shell py-8 sm:py-10 md:py-14">
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
      )}

      <section className="shell pb-8 pt-6 md:py-12">
        <InViewGroup className="finale-stage">
          <div className="finale text-center">
            <div className="finale-media" aria-hidden>
              <img src={finaleImage} alt="" />
            </div>
            <div className="relative z-10 px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
              {home.finale.kicker && (
                <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{home.finale.kicker}</p>
              )}
              <h2 className="finale-title mt-3 font-serif text-xl gold-text sm:text-2xl md:text-3xl">{home.finale.title}</h2>
              {home.finale.copy && (
                <p className="finale-copy mx-auto mt-4 max-w-xl text-sm text-lilac sm:text-base">
                  {home.finale.copy}
                </p>
              )}
              <div className="finale-actions mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:mt-8">
                {home.finale.primaryCta?.label && (
                  <Button to={home.finale.primaryCta.to || '/customize'} className="w-full min-[420px]:w-auto">
                    {home.finale.primaryCta.label}
                  </Button>
                )}
                {home.finale.secondaryCta?.label && (
                  <Button to={home.finale.secondaryCta.to || '/shop'} variant="ghost" className="w-full min-[420px]:w-auto">
                    {home.finale.secondaryCta.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </InViewGroup>
      </section>
    </div>
  );
}
