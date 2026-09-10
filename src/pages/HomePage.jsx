import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Hand, Lock, Shield, Sparkles } from 'lucide-react';
import api from '../api/client';
import Hero from '../components/home/Hero';
import SectionHead from '../components/home/SectionHead';
import RitualSteps from '../components/home/RitualSteps';
import HousesRow from '../components/home/HousesRow';
import Testimonials from '../components/home/Testimonials';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reveal from '../components/ui/Reveal';
import InViewGroup from '../components/ui/InViewGroup';
import { FAMILIES } from '../lib/format';
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

const RITUAL = [
  { n: '01', title: 'Purpose', body: 'Begin with why you wear it — calm, abundance, protection, or love.' },
  { n: '02', title: 'Intention', body: 'Choose the feeling. Its crystals are selected for you, not guessed at checkout.' },
  { n: '03', title: 'Calibration', body: 'Your date of birth sets the Mulank. Counts are composed to that number.' },
  { n: '04', title: 'Charm', body: 'Sriyantra or Om at the clasp, on Korean elastic or sized steel core.' },
];

const CLAIM_ICONS = {
  'Natural & Authentic': Gem,
  'Designed for Intentions': Sparkles,
  Handmade: Hand,
  'Energized / Cleansed': Sparkles,
  'Secure Payments': Shield,
};

const MARQUEE = [
  'Energy',
  'Abundance',
  'Wellness',
  'Crystals',
  'Rudraksha',
  'Gemstones',
  'Customization',
  'Handmade',
];

export default function HomePage() {
  const [content, setContent] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [purposes, setPurposes] = useState([]);

  useEffect(() => {
    api.get('/content').then(({ data }) => setContent(data.content)).catch(() => {});
    api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {});
    api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {});
  }, []);

  const hero = content?.hero || {};
  const claims = content?.trustClaims || [];
  const studioPurposes = (purposes.length ? purposes : FALLBACK_PURPOSES).slice(0, 6);

  return (
    <div className="home-page">
      <Hero hero={hero} />

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={`${item}-${i}`} className="marquee-item">
              {item}
              <span className="marquee-dot" />
            </span>
          ))}
        </div>
      </div>

      <section className="shell py-8 sm:py-10 md:py-14">
        <Reveal variant="head">
          <SectionHead
            eyebrow="The atelier"
            title="Three houses"
            body="Every collection lives in one of three houses. Enter any of them — or begin in the studio and compose a strand of your own."
          />
        </Reveal>
        <HousesRow houses={FAMILIES} />
      </section>

      <section className="relative py-8 sm:py-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 lotus-corner" />
        <div className="relative shell">
          <Reveal variant="head">
            <SectionHead
              eyebrow="The studio"
              title="Customization"
              body="Choose a purpose, then an intention. Crystals are placed from your Mulank, then closed with a Sriyantra or Om charm."
              to="/customize"
              action="Open the studio →"
            />
          </Reveal>

          <Link to="/customize" className="studio-invite mt-8 group block overflow-hidden sm:mt-10">
            <div className="studio-invite-media" aria-hidden>
              <img src={studioBanner} alt="" />
            </div>
            <div className="studio-invite-copy">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Begin a strand</p>
              <h3 className="mt-2 font-serif text-xl gold-text sm:text-2xl">Compose your bracelet</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-lilac">
                Purpose, intention, Mulank, zodiac, and a name — made to your wrist, not picked from a tray.
              </p>
              <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-gold transition group-hover:translate-x-1">
                Open the studio →
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
          <SectionHead
            eyebrow="The ritual"
            title="How a strand is made"
            body="Four steps. No catalogue guesswork — the bracelet is composed in sequence, then made by hand."
          />
        </Reveal>
        <RitualSteps steps={RITUAL} />
      </section>

      {featured.length > 0 && (
        <section className="shell py-8 sm:py-10 md:py-14">
          <Reveal variant="head">
            <SectionHead
              eyebrow="The collection"
              title="Featured pieces"
              body="Ready-made works from the three houses — for those who wish to choose rather than compose."
              to="/shop"
              action="Shop all →"
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
            <SectionHead
              eyebrow="Voices"
              title="From those who wear it"
              body="Quiet notes from custom strands and the three houses — written without medical claims."
            />
          </Reveal>
          <Testimonials items={content?.testimonials} />
        </div>
      </section>

      {claims.length > 0 && (
        <section className="shell py-8 sm:py-10 md:py-14">
          <Reveal variant="head">
            <SectionHead
              eyebrow="The house"
              title="Why Kuberstones"
              body="Crystal associations are traditional and spiritual. They are not medical claims. The making, however, is exact."
            />
          </Reveal>
          <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {claims.map((c, i) => {
              const Icon = CLAIM_ICONS[c.title] || Lock;
              return (
                <div key={c.title} className="trust-item" style={{ '--i': i }}>
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
              <img src={finaleBanner} alt="" />
            </div>
            <div className="relative z-10 px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Begin</p>
              <h2 className="finale-title mt-3 font-serif text-xl gold-text sm:text-2xl md:text-3xl">A bracelet with a reason.</h2>
              <p className="finale-copy mx-auto mt-4 max-w-xl text-sm text-lilac sm:text-base">
                Start with a purpose in the studio, or walk the three houses until a piece finds you.
              </p>
              <div className="finale-actions mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:mt-8">
                <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
              </div>
            </div>
          </div>
        </InViewGroup>
      </section>
    </div>
  );
}
