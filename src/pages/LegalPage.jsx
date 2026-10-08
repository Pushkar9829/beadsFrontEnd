import { useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import ContactDrawer from '../components/layout/ContactDrawer';
import { companyContacts, getPolicy, POLICY_NAV } from '../lib/policies';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle, useStoreIdentity } from '../store/settingsStore';
import { PageIntro } from '../components/home/nocturne/Listing';

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
      paragraphs: section.body ? [section.body] : section.paragraphs || [],
      bullets: section.bullets || [],
    })),
  };
}

const anchor = (s, i) => `s${i + 1}-${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;

export default function LegalPage({ kind }) {
  const [contactOpen, setContactOpen] = useState(false);
  const site = useSite();
  const brand = useBrand();
  const store = useStoreIdentity();
  const page = policyFromCms(kind, site) || getPolicy(kind);
  const contacts = companyContacts(site.footer, store);
  const finale = site.finale || {};
  const contactLabel = site.contact?.cta || site.footer?.cta || 'Contact us';
  const legal = site.pages?.legal || {};
  const navTitle = legal.navTitle || 'Policies & care';
  const g = legal.grievance || {};

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(page.title, brand)} description={page.description} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageIntro
        crumbs={[{ label: 'Home', to: '/' }, { label: page.title }]}
        eyebrow={page.eyebrow || navTitle}
        title={page.title}
        body={page.description}
        actions={
          <button type="button" className="nx-btn nx-btn-o" onClick={() => setContactOpen(true)}>
            {contactLabel}
          </button>
        }
      />

      <div className="nx-w nx-sec nx-split">
        <aside className="nx-split-side nx-sticky">
          <nav aria-label="Policies" className="nx-side-nav">
            <p className="nx-eb">{navTitle}</p>
            {POLICY_NAV.map((item) => (
              <Link key={item.to} to={item.to} className={item.to === `/${page.slug}` ? 'is-on' : ''} aria-current={item.to === `/${page.slug}` ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          {page.sections.length > 2 && (
            <nav aria-label="On this page" className="nx-side-nav is-toc">
              <p className="nx-eb">On this page</p>
              {page.sections.map((s, i) => (
                <a key={s.heading} href={`#${anchor(s.heading, i)}`}>
                  {s.heading}
                </a>
              ))}
            </nav>
          )}
        </aside>

        <div className="nx-policy">
          {page.sections.map((section, i) => (
            <section key={section.heading} id={anchor(section.heading, i)} className="nx-policy-s">
              <p className="nx-policy-n">{String(i + 1).padStart(2, '0')}</p>
              <div>
                <h2 className="nx-d nx-policy-h">{section.heading}</h2>
                <div className="nx-prose">
                  {(section.paragraphs || []).map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {section.bullets?.length > 0 && (
                    <ul className="nx-ticks">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}

          {kind === 'grievance' && (
            <section className="nx-panel">
              <p className="nx-eb">{g.detailsEyebrow || 'How to reach us'}</p>
              <h2 className="nx-d nx-policy-h">{g.detailsTitle || 'Company details'}</h2>
              <dl className="nx-facts-dl">
                <Detail label="Brand" value={contacts.brand} />
                <Detail label="Legal entity / operator" value={contacts.legalEntity} />
                <Detail label="Email">
                  <a href={contacts.emailHref}>{contacts.email}</a>
                </Detail>
                <Detail label="Phone" value={contacts.phone || 'Available on request via support email'} />
                <Detail label="Address" value={contacts.address || 'India'} />
                <Detail label="Grievance officer" value={contacts.grievanceOfficer || 'Write to the grievance email and we will route your complaint'} />
                <Detail label="Grievance email">
                  <a href={contacts.grievanceEmailHref}>{contacts.grievanceEmail}</a>
                </Detail>
              </dl>
              <p className="nx-lede">{g.detailsNote || 'Include your order number, registered contact details and a concise description of the issue.'}</p>
              <button type="button" className="nx-btn nx-mt" onClick={() => setContactOpen(true)}>
                {g.writeLabel || 'Write to us'}
              </button>
            </section>
          )}
        </div>
      </div>

      <section className="nx-close">
        <div className="nx-w">
          <p className="nx-eb">{finale.kicker || brand.display}</p>
          <h2 className="nx-d nx-close-t">{finale.title || brand.tagline}</h2>
          {finale.copy && <p className="nx-lede">{finale.copy}</p>}
          <div className="nx-close-a">
            <button type="button" className="nx-btn" onClick={() => setContactOpen(true)}>
              {contactLabel}
            </button>
            {finale.secondaryCta?.label && (
              <Link to={finale.secondaryCta.to || '/shop'} className="nx-btn nx-btn-o">
                {String(finale.secondaryCta.label).replace(/\s*→\s*$/, '')}
              </Link>
            )}
          </div>
        </div>
      </section>
      <ContactDrawer open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}

function Detail({ label, value, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || value}</dd>
    </div>
  );
}
