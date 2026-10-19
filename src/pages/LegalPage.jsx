import { useState } from 'react';
import SeoHead from '../components/SeoHead';
import ContactDrawer from '../components/layout/ContactDrawer';
import { companyContacts, getPolicy } from '../lib/policies';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle, useStoreIdentity } from '../store/settingsStore';
import { SectionTitle } from '../components/home/atelier/AtelierHome';

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
  const legal = site.pages?.legal || {};
  const navTitle = legal.navTitle || 'Policies & care';
  const g = legal.grievance || {};

  return (
    <div className="info-page">
      <SeoHead title={pageTitle(page.title, brand)} description={page.description} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="container-custom info-narrow">
        <span className="section-eyebrow">{page.eyebrow || navTitle}</span>
        <SectionTitle text={page.title} as="h1" className="section-title info-title" />

        {/* Source: one card of paragraphs. Every section of the policy stays, as a heading + its text. */}
        <div className="info-policy">
          {page.description && <p>{page.description}</p>}
          {page.sections.map((section, i) => (
            <section key={section.heading} id={anchor(section.heading, i)}>
              <h2 className="info-policy-h">{section.heading}</h2>
              {(section.paragraphs || []).map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.bullets?.length > 0 && (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {kind === 'grievance' && (
            <section>
              <h2 className="info-policy-h">{g.detailsTitle || 'Company details'}</h2>
              <p>
                <strong>Brand:</strong> {contacts.brand}
                <br />
                <strong>Legal entity / operator:</strong> {contacts.legalEntity}
                <br />
                <strong>Email:</strong> <a href={contacts.emailHref}>{contacts.email}</a>
                <br />
                <strong>Phone:</strong> {contacts.phone || 'Available on request via support email'}
                <br />
                <strong>Address:</strong> {contacts.address || 'India'}
                <br />
                <strong>Grievance officer:</strong> {contacts.grievanceOfficer || 'Write to the grievance email and we will route your complaint'}
                <br />
                <strong>Grievance email:</strong> <a href={contacts.grievanceEmailHref}>{contacts.grievanceEmail}</a>
              </p>
              <p>{g.detailsNote || 'Include your order number, registered contact details and a concise description of the issue.'}</p>
              <button type="button" className="btn-gold" onClick={() => setContactOpen(true)}>
                {g.writeLabel || 'Write to us'}
              </button>
            </section>
          )}
        </div>
      </div>
      <ContactDrawer open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
