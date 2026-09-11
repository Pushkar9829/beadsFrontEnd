import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import { useSite } from '../store/contentStore';

export default function LegalPage({ kind }) {
  const site = useSite();
  const finale = site.finale;
  const legal = site.pages.legal;
  const page = legal[kind] || legal.terms;
  const crumbs = [
    { label: 'Home', to: '/' },
    { label: page.title },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={page.body}
            to="/shop"
            action="Shop all →"
          />
        </div>

        <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {(page.sections || []).map((section, i) => (
            <div key={section.heading || i} className="trust-item" style={{ '--i': i }}>
              <article className="trust-card h-full p-6">
                <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-4 font-serif text-lg text-gold-light">{section.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-lilac">{section.body}</p>
              </article>
            </div>
          ))}
        </InViewGroup>

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
