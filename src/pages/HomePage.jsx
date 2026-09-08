import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Hand, Lock, Shield, Sparkles } from 'lucide-react';
import api from '../api/client';
import Hero from '../components/home/Hero';
import SectionHead from '../components/home/SectionHead';
import RitualSteps from '../components/home/RitualSteps';
import HousesRow from '../components/home/HousesRow';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reveal from '../components/ui/Reveal';
import InViewGroup from '../components/ui/InViewGroup';
import { FAMILIES } from '../lib/format';

const RITUAL = [
  { n: '01', title: 'Purpose', body: 'Begin with why you wear it — calm, abundance, protection, or love.' },
  { n: '02', title: 'Intention', body: 'Choose the feeling. Its crystals are selected for you, not guessed at checkout.' },
  { n: '03', title: 'Calibration', body: 'Your date of birth sets the Mulank. Counts are composed to that number.' },
  { n: '04', title: 'Name', body: 'Zodiac beads and an engraving close the strand. The piece is then yours.' },
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
  const studioPurposes = purposes.slice(0, 6);

  return (
    <div>
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

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <Reveal variant="head">
          <SectionHead
            eyebrow="The atelier"
            title="Three houses"
            body="Every collection lives in one of three houses. Enter any of them — or begin in the studio and compose a strand of your own."
          />
        </Reveal>
        <HousesRow houses={FAMILIES} />
      </section>

      {studioPurposes.length > 0 && (
        <section className="relative py-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 lotus-corner" />
          <div className="relative mx-auto max-w-7xl px-4">
            <Reveal variant="head">
              <SectionHead
                eyebrow="The studio"
                title="Customization"
                body="Choose a purpose, then an intention. Crystals are placed from your Mulank, finished with zodiac beads, and named."
                to="/customize"
                action="Open the studio →"
              />
            </Reveal>
            <InViewGroup className="studio-grid mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {studioPurposes.map((p, i) => (
                <div key={p._id} className="purpose-item" style={{ '--i': i }}>
                  <Link to={`/customize?purpose=${p.slug}`} className="purpose-card group block h-full">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-gold/80">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-3 font-serif text-xl">{p.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-lilac">{p.description}</p>
                    <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold opacity-80 transition group-hover:opacity-100">
                      Begin →
                    </p>
                  </Link>
                </div>
              ))}
            </InViewGroup>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
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
        <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <Reveal variant="head">
            <SectionHead
              eyebrow="The collection"
              title="Featured pieces"
              body="Ready-made works from the three houses — for those who wish to choose rather than compose."
              to="/shop"
              action="Shop all →"
            />
          </Reveal>
          <InViewGroup className="feature-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <div key={p._id} className="feature-item" style={{ '--i': i }}>
                <ProductCard product={p} description={p.shortDescription} />
              </div>
            ))}
          </InViewGroup>
        </section>
      )}

      {claims.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <Reveal variant="head">
            <SectionHead
              eyebrow="The house"
              title="Why Kuberstones"
              body="Crystal associations are traditional and spiritual. They are not medical claims. The making, however, is exact."
            />
          </Reveal>
          <InViewGroup className="trust-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {claims.map((c, i) => {
              const Icon = CLAIM_ICONS[c.title] || Lock;
              return (
                <div key={c.title} className="trust-item" style={{ '--i': i }}>
                  <article className="trust-card h-full p-6">
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

      <section className="px-4 pb-8 pt-8 md:py-12">
        <InViewGroup className="finale-stage">
          <div className="finale mx-auto max-w-7xl px-6 py-16 text-center md:px-16 md:py-20">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Begin</p>
            <h2 className="finale-title mt-3 font-serif text-3xl gold-text md:text-5xl">A bracelet with a reason.</h2>
            <p className="finale-copy mx-auto mt-4 max-w-xl text-lilac">
              Start with a purpose in the studio, or walk the three houses until a piece finds you.
            </p>
            <div className="finale-actions mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/customize">Customization</Button>
              <Button to="/shop" variant="ghost">Shop All</Button>
            </div>
          </div>
        </InViewGroup>
      </section>
    </div>
  );
}
