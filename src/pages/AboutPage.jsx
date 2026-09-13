import { Link } from 'react-router-dom';
import { mediaUrl } from '../api/client';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import { ABOUT_BRAND } from '../lib/aboutBrand';
import { useSite } from '../store/contentStore';
import logo from '../assets/brand/logo.jpg';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'About' },
];

export default function AboutPage() {
  const site = useSite();
  const page = site.pages.aboutPage;
  const finale = site.finale;
  const image = page.image ? mediaUrl(page.image) : logo;
  const brand = ABOUT_BRAND;

  return (
    <div className="relative">
      <SeoHead
        title={`${brand.headline} · Kuberstones`}
        description={brand.intro[0]}
      />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <img
            src={image}
            alt="Kuberstones"
            className="mx-auto h-36 w-36 rounded-full object-cover ring-1 ring-gold/40 sm:h-40 sm:w-40 lg:mx-0 lg:h-44 lg:w-44"
          />
          <div>
            <SectionHead
              eyebrow={page.eyebrow || brand.eyebrow}
              title={brand.headline}
              body={brand.tagline}
              to={page.to || '/customize'}
              action={page.action || 'Customization →'}
            />
            <div className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-lilac md:text-base">
              {brand.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {site.about?.body ? <p className="whitespace-pre-line">{site.about.body}</p> : null}
            </div>
          </div>
        </div>

        <section className="mt-14 sm:mt-16">
          <SectionHead eyebrow="The studio" title={brand.moreTitle} />
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-lilac md:text-base">{brand.moreBody}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {brand.morePoints.map((point) => (
              <li
                key={point}
                className="rounded-2xl border border-gold/20 bg-surface/80 px-4 py-3 text-sm text-ivory/90"
              >
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-lilac md:text-base">{brand.moreClose}</p>
        </section>

        <section className="mt-14 sm:mt-16">
          <SectionHead
            eyebrow="The houses"
            title={brand.collectionsTitle}
            to="/shop-by-purpose"
            action="Shop by purpose →"
          />
          <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
            {brand.collections.map((item, i) => (
              <div key={item.name} className="trust-item" style={{ '--i': i }}>
                <Link to={item.to} className="trust-card block h-full p-6 transition hover:border-gold/50">
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

        <section className="mt-14 sm:mt-16">
          <SectionHead eyebrow="The house" title={brand.differentTitle} />
          <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {brand.different.map((item, i) => (
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

        <section className="mt-14 sm:mt-16">
          <SectionHead eyebrow={brand.approachTitle} title={brand.approachKicker} body={brand.approachBody} />
          <InViewGroup className="trust-grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brand.steps.map((step, i) => (
              <div key={step.title} className="trust-item" style={{ '--i': i }}>
                <article className="trust-card h-full p-6">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-gold">{step.n}</span>
                  <h3 className="mt-4 font-serif text-lg text-gold-light">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lilac">{step.body}</p>
                </article>
              </div>
            ))}
          </InViewGroup>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-lilac">{brand.approachNote}</p>
        </section>

        <section className="mt-14 grid gap-8 sm:mt-16 lg:grid-cols-2">
          <article className="rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Vision</p>
            <h2 className="mt-3 font-serif text-2xl gold-text">{brand.visionTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-lilac">{brand.vision}</p>
          </article>
          <article className="rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Promise</p>
            <h2 className="mt-3 font-serif text-2xl gold-text">{brand.promiseTitle}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-lilac">
              {brand.promises.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <InViewGroup className="finale-stage mt-12 sm:mt-16">
          <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{brand.closeEntity}</p>
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">{brand.closeLine}</h2>
            {finale.copy && (
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">{finale.copy}</p>
            )}
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button to="/customize" className="w-full min-[420px]:w-auto">
                {finale.primaryCta?.label || 'Customization'}
              </Button>
              <Button to="/shop-by-purpose" variant="ghost" className="w-full min-[420px]:w-auto">
                Shop by purpose
              </Button>
            </div>
          </div>
        </InViewGroup>
      </div>
    </div>
  );
}
