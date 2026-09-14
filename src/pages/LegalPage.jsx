import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import ContactDrawer from '../components/layout/ContactDrawer';
import { companyContacts, getPolicy, POLICY_NAV } from '../lib/policies';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle, useStoreIdentity } from '../store/settingsStore';

function policyFromCms(kind, site) {
  const cms = site?.pages?.legal?.[kind];
  if (!cms || !(cms.title || cms.body || cms.sections?.length)) return null;
  return {
    slug: kind,
    title: cms.title,
    eyebrow: cms.eyebrow,
    description: cms.body,
    sections: (cms.sections || []).map((section) => ({
      heading: section.heading,
      paragraphs: section.body ? [section.body] : (section.paragraphs || []),
      bullets: section.bullets || [],
    })),
  };
}

export default function LegalPage({ kind }) {
  const [contactOpen, setContactOpen] = useState(false);
  const site = useSite();
  const brand = useBrand();
  const store = useStoreIdentity();
  const page = policyFromCms(kind, site) || getPolicy(kind);
  const contacts = companyContacts(site.footer, store);
  const finale = site.finale || {};
  const crumbs = [
    { label: 'Home', to: '/' },
    { label: page.title },
  ];

  return (
    <div className="relative">
      <SeoHead title={pageTitle(page.title, brand)} description={page.description} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={page.description}
            to="/grievance"
            action="Contact & grievance →"
          />
        </div>

        <div className="mt-10 max-w-3xl space-y-8">
          {page.sections.map((section) => (
            <article key={section.heading} className="rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
              <h2 className="font-serif text-xl gold-text">{section.heading}</h2>
              {(section.paragraphs || []).map((p) => (
                <p key={p} className="mt-4 text-sm leading-relaxed text-lilac md:text-base">{p}</p>
              ))}
              {section.bullets?.length > 0 && (
                <ul className="mt-4 space-y-2.5 text-sm text-lilac md:text-base">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {kind === 'grievance' && (
          <section className="mt-10 max-w-3xl rounded-3xl border border-gold/20 bg-surface/80 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">How to reach us</p>
            <h2 className="mt-3 font-serif text-xl gold-text">Company details</h2>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Brand" value={contacts.brand} />
              <Detail label="Legal entity / operator" value={contacts.legalEntity} />
              <Detail label="Email">
                <a href={contacts.emailHref} className="text-gold hover:text-gold-light">{contacts.email}</a>
              </Detail>
              <Detail label="Phone" value={contacts.phone || 'Available on request via support email'} />
              <Detail label="Address" value={contacts.address || 'India'} />
              <Detail label="Grievance officer" value={contacts.grievanceOfficer || 'Write to the grievance email and we will route your complaint'} />
              <Detail label="Grievance email">
                <a href={contacts.grievanceEmailHref} className="text-gold hover:text-gold-light">{contacts.grievanceEmail}</a>
              </Detail>
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-lilac">
              Include your order number, registered contact details and a concise description of the issue.
            </p>
            <div className="mt-6">
              <Button onClick={() => setContactOpen(true)}>Write to us</Button>
            </div>
          </section>
        )}

        <nav className="mt-12" aria-label="Policies">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Policies & care</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {POLICY_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition ${
                  item.to === `/${page.slug}`
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-gold/25 text-lilac hover:border-gold hover:text-gold'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <InViewGroup className="finale-stage mt-12 sm:mt-16">
          <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{finale.kicker || brand.display}</p>
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">
              {finale.title || brand.tagline}
            </h2>
            {finale.copy ? (
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">{finale.copy}</p>
            ) : null}
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button onClick={() => setContactOpen(true)} className="w-full min-[420px]:w-auto">
                {site.contact?.cta || site.footer?.cta || 'Contact us'}
              </Button>
              {finale.secondaryCta?.label && (
                <Button to={finale.secondaryCta.to || '/shop'} variant="ghost" className="w-full min-[420px]:w-auto">
                  {finale.secondaryCta.label}
                </Button>
              )}
            </div>
          </div>
        </InViewGroup>
      </div>
      <ContactDrawer open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}

function Detail({ label, value, children }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-gold">{label}</dt>
      <dd className="mt-1 text-ivory/90">{children || value}</dd>
    </div>
  );
}
