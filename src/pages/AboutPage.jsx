import { Link } from 'react-router-dom';
import { mediaUrl } from '../api/client';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import fallbackLogo from '../assets/brand/logo.jpg';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'About' },
];

export default function AboutPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.aboutPage;
  const finale = site.finale;
  const copy = site.about || {};
  const image = page.image ? mediaUrl(page.image) : brand.logo || fallbackLogo;
  const intro = Array.isArray(copy.intro) ? copy.intro.filter(Boolean) : [];
  const morePoints = Array.isArray(copy.morePoints) ? copy.morePoints.filter(Boolean) : [];
  const collections = Array.isArray(copy.collections) ? copy.collections : [];
  const different = Array.isArray(copy.different) ? copy.different : [];
  const steps = Array.isArray(copy.steps) ? copy.steps : [];
  const promises = Array.isArray(copy.promises) ? copy.promises.filter(Boolean) : [];

  return (
    <div className="relative">
      <SeoHead
        title={pageTitle(copy.headline || 'About', brand)}
        description={intro[0] || copy.tagline || copy.body}
        keywords={brand.seo?.keywords}
        image={brand.seo?.ogImage || page.image}
        noIndex={brand.seo?.noIndex}
      />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <img
            src={image}
            alt={brand.name}
            className="mx-auto h-36 w-36 rounded-full object-cover ring-1 ring-gold/40 sm:h-40 sm:w-40 lg:mx-0 lg:h-44 lg:w-44"
          />
          <div>
            <SectionHead
              eyebrow={page.eyebrow || copy.eyebrow}
              title={copy.headline}
              body={copy.tagline}
              to={page.to || '/customize'}
              action={page.action || 'Customization →'}
            />
            <div className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed sky-copy md:text-base">
              {intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {copy.body ? <p className="whitespace-pre-line">{copy.body}</p> : null}
            </div>
          </div>
        </div>

        {(copy.moreTitle || morePoints.length > 0) && (
          <section className="mt-14 sm:mt-16">
            <SectionHead eyebrow="The studio" title={copy.moreTitle} />
            {copy.moreBody ? <p className="mt-5 max-w-3xl text-sm leading-relaxed sky-copy md:text-base">{copy.moreBody}</p> : null}
            {morePoints.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {morePoints.map((point) => (
                  <li
                    key={point}
                    className="rounded-2xl border border-gold/20 bg-surface/80 px-4 py-3 text-sm text-ivory/90"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            )}
            {copy.moreClose ? <p className="mt-6 max-w-3xl text-sm leading-relaxed sky-copy md:text-base">{copy.moreClose}</p> : null}
          </section>
        )}

        {collections.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHead
              eyebrow="The houses"
              title={copy.collectionsTitle}
              to={site.purpose?.to || '/customize/purpose'}
              action={site.purpose?.action || 'Shop by purpose →'}
            />
            <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
              {collections.map((item, i) => (
                <div key={item.name} className="trust-item" style={{ '--i': i }}>
                  <Link to={item.to || '/shop'} className="trust-card block h-full p-6 transition hover:border-gold/50">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 font-serif text-lg text-gold-light">{item.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-lilac">{item.body}</p>
                  </Link>
                </div>
              ))}
            </InViewGroup>
          </section>
        )}

        {different.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHead eyebrow="The house" title={copy.differentTitle} />
            <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {different.map((item, i) => (
                <div key={item.title} className="trust-item" style={{ '--i': i }}>
                  <article className="trust-card h-full p-6">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 font-serif text-lg text-gold-light">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-lilac">{item.body}</p>
                  </article>
                </div>
              ))}
            </InViewGroup>
          </section>
        )}

        {steps.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHead eyebrow={copy.approachTitle} title={copy.approachKicker} body={copy.approachBody} />
            <InViewGroup className="trust-grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.title} className="trust-item" style={{ '--i': i }}>
                  <article className="trust-card h-full p-6">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-gold">{step.n}</span>
                    <h3 className="mt-4 font-serif text-lg text-gold-light">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-lilac">{step.body}</p>
                  </article>
                </div>
              ))}
            </InViewGroup>
            {copy.approachNote ? <p className="mt-6 max-w-3xl text-sm leading-relaxed sky-copy">{copy.approachNote}</p> : null}
          </section>
        )}

        {(copy.vision || promises.length > 0) && (
          <section className="mt-14 grid gap-8 sm:mt-16 lg:grid-cols-2">
            {copy.vision ? (
              <article className="rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Vision</p>
                <h2 className="mt-3 font-serif text-2xl gold-text">{copy.visionTitle}</h2>
                <p className="mt-4 text-sm leading-relaxed text-lilac">{copy.vision}</p>
              </article>
            ) : null}
            {promises.length > 0 ? (
              <article className="rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Promise</p>
                <h2 className="mt-3 font-serif text-2xl gold-text">{copy.promiseTitle}</h2>
                <ul className="mt-4 space-y-2.5 text-sm text-lilac">
                  {promises.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        )}

        <InViewGroup className="finale-stage mt-12 sm:mt-16">
          <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{copy.closeEntity}</p>
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">{copy.closeLine}</h2>
            {finale.copy && (
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">{finale.copy}</p>
            )}
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button to={finale.primaryCta?.to || '/customize'} className="w-full min-[420px]:w-auto">
                {finale.primaryCta?.label || 'Customization'}
              </Button>
              <Button to={site.purpose?.to || '/customize/purpose'} variant="ghost" className="w-full min-[420px]:w-auto">
                {site.purpose?.title || 'Shop by purpose'}
              </Button>
            </div>
          </div>
        </InViewGroup>
      </div>
    </div>
  );
}
