import { mediaUrl } from '../api/client';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import { claimIcon } from '../lib/claimIcons';
import { useSite } from '../store/contentStore';
import logo from '../assets/brand/logo.jpg';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'About' },
];

export default function AboutPage() {
  const site = useSite();
  const about = site.about;
  const page = site.pages.aboutPage;
  const claims = site.trustClaims;
  const finale = site.finale;
  const image = page.image ? mediaUrl(page.image) : logo;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <img
            src={image}
            alt={about.headline || 'Kuberstones'}
            className="mx-auto h-36 w-36 rounded-full object-cover ring-1 ring-gold/40 sm:h-40 sm:w-40 lg:mx-0 lg:h-44 lg:w-44"
          />
          <div>
            <SectionHead
              eyebrow={page.eyebrow}
              title={about.headline}
              body={about.tagline}
              to={page.to}
              action={page.action}
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
              eyebrow={site.trust.eyebrow}
              title={site.trust.title}
              body={site.trust.body}
            />
            <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {claims.map((c, i) => {
                const Icon = claimIcon(c);
                return (
                  <div key={`${c.title}-${i}`} className="trust-item" style={{ '--i': i }}>
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
            {finale.kicker && (
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{finale.kicker}</p>
            )}
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">{finale.title}</h2>
            {finale.copy && (
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">{finale.copy}</p>
            )}
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              {finale.primaryCta?.label && (
                <Button to={finale.primaryCta.to || '/customize'} className="w-full min-[420px]:w-auto">
                  {finale.primaryCta.label}
                </Button>
              )}
              {finale.secondaryCta?.label && (
                <Button to={finale.secondaryCta.to || '/shop'} variant="ghost" className="w-full min-[420px]:w-auto">
                  {finale.secondaryCta.label}
                </Button>
              )}
            </div>
          </div>
        </InViewGroup>
      </div>
    </div>
  );
}
