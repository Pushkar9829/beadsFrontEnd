import { useEffect, useState } from 'react';
import { Gem, Hand, Lock, Shield, Sparkles } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import logo from '../assets/brand/logo.jpg';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'About' },
];

const CLAIM_ICONS = {
  'Natural & Authentic': Gem,
  'Designed for Intentions': Sparkles,
  Handmade: Hand,
  'Energized / Cleansed': Sparkles,
  'Secure Payments': Shield,
};

export default function AboutPage() {
  const [content, setContent] = useState(null);
  useEffect(() => {
    api.get('/content').then(({ data }) => setContent(data.content)).catch(() => {});
  }, []);
  const about = content?.about || {};
  const claims = content?.trustClaims || [];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <img
            src={logo}
            alt="Kuberstones"
            className="mx-auto h-36 w-36 rounded-full object-cover ring-1 ring-gold/40 sm:h-40 sm:w-40 lg:mx-0 lg:h-44 lg:w-44"
          />
          <div>
            <SectionHead
              eyebrow="The house"
              title={about.headline || 'Jewellery as a quiet ritual'}
              body={about.tagline || 'Editorial luxury for modern seekers.'}
              to="/customize"
              action="Customization →"
            />
            {about.body && (
              <div className="mt-6 max-w-2xl space-y-4 whitespace-pre-line text-sm leading-relaxed text-lilac md:text-base">
                {about.body}
              </div>
            )}
          </div>
        </div>

        {claims.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <SectionHead
              eyebrow="The atelier"
              title="Why Kuberstones"
              body="Crystal associations are traditional and spiritual. They are not medical claims. The making, however, is exact."
            />
            <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
          </div>
        )}

        <InViewGroup className="finale-stage mt-12 sm:mt-16">
          <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Begin</p>
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">A bracelet with a reason.</h2>
            <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
              Start with a purpose in the studio, or walk the three houses until a piece finds you.
            </p>
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
              <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
            </div>
          </div>
        </InViewGroup>
      </div>
    </div>
  );
}
