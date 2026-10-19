// About, ported from beeds_ecommerce/src/pages/InfoPages.jsx (type "about"): eyebrow, headline with a gold
// italic tail, paragraphs, and the "Explore The Atelier" card. Headline and card: admin → Site pages → About
// layout; paragraphs: About copy. Styles: styles/atelier/info.css.
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

export default function AboutPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.aboutPage || {};
  const copy = site.about || {};
  const paragraphs = [...(Array.isArray(copy.intro) ? copy.intro : []), copy.body].filter(Boolean);

  return (
    <div className="info-page">
      <SeoHead title={pageTitle(copy.headline || 'About', brand)} description={paragraphs[0] || copy.tagline} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="container-custom info-narrow">
        {page.kicker && <span className="section-eyebrow">{page.kicker}</span>}
        <h1 className="section-title info-title">
          {page.titleLead} {page.titleTail && <span className="gold-italic">{page.titleTail}</span>}
        </h1>

        <div className="info-prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {page.cardTitle && (
          <div className="info-card">
            <div>
              <h3 className="info-card-title">{page.cardTitle}</h3>
              {page.cardBody && <p className="info-card-body">{page.cardBody}</p>}
            </div>
            <Link to={page.cardTo || '/customize'} className="btn-gold">
              {clean(page.cardAction) || 'Compose Your Strand'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
