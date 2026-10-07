import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import { HOUSE_IMAGES, useReveal } from '../components/home/nocturne/Nocturne';
import { PageHero } from '../components/home/nocturne/Listing';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');
const n2 = (i) => String(i + 1).padStart(2, '0');

function Block({ eyebrow, title, body, children, alt = false, action }) {
  const ref = useReveal();
  return (
    <section ref={ref} className={`nx-sec nx-reveal${alt ? ' nx-alt' : ''}`}>
      <div className="nx-w">
        {(eyebrow || title) && (
          <div className="nx-head nx-head-tight">
            <div>
              {eyebrow && <p className="nx-eb">{eyebrow}</p>}
              {title && <h2 className="nx-d nx-h2 nx-h2-s">{title}</h2>}
              {body && <p className="nx-lede">{body}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  const site = useSite();
  const brand = useBrand();
  const page = site.pages.aboutPage;
  const finale = site.finale || {};
  const copy = site.about || {};
  const image = page.image ? mediaUrl(page.image) : HOUSE_IMAGES.crystals;
  const intro = Array.isArray(copy.intro) ? copy.intro.filter(Boolean) : [];
  const morePoints = Array.isArray(copy.morePoints) ? copy.morePoints.filter(Boolean) : [];
  const collections = Array.isArray(copy.collections) ? copy.collections : [];
  const different = Array.isArray(copy.different) ? copy.different : [];
  const steps = Array.isArray(copy.steps) ? copy.steps : [];
  const promises = Array.isArray(copy.promises) ? copy.promises.filter(Boolean) : [];
  const [lead, ...restIntro] = intro;
  const closeRef = useReveal();

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(copy.headline || 'About', brand)} description={intro[0] || copy.tagline || copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage || page.image} noIndex={brand.seo?.noIndex} />
      <PageHero
        image={image}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
        eyebrow={page.eyebrow || copy.eyebrow}
        title={copy.headline || 'About'}
        body={copy.tagline}
        actions={
          <Link to={page.to || '/customize'} className="nx-lnk">
            {clean(page.action) || 'Customization'} →
          </Link>
        }
      />

      {(lead || copy.body) && (
        <Block>
          <div className="nx-about-intro">
            {lead && <p className="nx-about-lead">{lead}</p>}
            <div className="nx-prose">
              {restIntro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {copy.body && <p style={{ whiteSpace: 'pre-line' }}>{copy.body}</p>}
            </div>
          </div>
        </Block>
      )}

      {(copy.moreTitle || morePoints.length > 0) && (
        <Block alt eyebrow="The studio" title={copy.moreTitle} body={copy.moreBody}>
          {morePoints.length > 0 && (
            <ol className="nx-points">
              {morePoints.map((point, i) => (
                <li key={point}>
                  <span>{n2(i)}</span>
                  {point}
                </li>
              ))}
            </ol>
          )}
          {copy.moreClose && <p className="nx-lede nx-mt">{copy.moreClose}</p>}
        </Block>
      )}

      {collections.length > 0 && (
        <Block
          eyebrow="The houses"
          title={copy.collectionsTitle}
          action={
            <Link to={site.purpose?.to || '/customize/purpose'} className="nx-lnk">
              {clean(site.purpose?.action) || 'Shop by purpose'} →
            </Link>
          }
        >
          <div className="nx-tcards is-2">
            {collections.map((item, i) => (
              <Link key={item.name} to={item.to || '/shop'} className="nx-tcard is-link">
                <span className="nx-tcard-n">{n2(i)}</span>
                <span className="nx-d nx-tcard-h">{item.name}</span>
                <span className="nx-tcard-p">{item.body}</span>
                <ArrowRight className="nx-tcard-go" size={16} strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </Block>
      )}

      {different.length > 0 && (
        <Block alt eyebrow="The house" title={copy.differentTitle}>
          <div className="nx-tcards is-3">
            {different.map((item, i) => (
              <article key={item.title} className="nx-tcard">
                <span className="nx-tcard-n">{n2(i)}</span>
                <h3 className="nx-d nx-tcard-h">{item.title}</h3>
                <p className="nx-tcard-p">{item.body}</p>
              </article>
            ))}
          </div>
        </Block>
      )}

      {steps.length > 0 && (
        <Block eyebrow={copy.approachTitle} title={copy.approachKicker} body={copy.approachBody}>
          <ol className="nx-steps">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="nx-tcard-n">{step.n || n2(i)}</span>
                <h3 className="nx-d nx-tcard-h">{step.title}</h3>
                <p className="nx-tcard-p">{step.body}</p>
              </li>
            ))}
          </ol>
          {copy.approachNote && <p className="nx-lede nx-mt">{copy.approachNote}</p>}
        </Block>
      )}

      {(copy.vision || promises.length > 0) && (
        <Block alt>
          <div className="nx-tcards is-2">
            {copy.vision && (
              <article className="nx-tcard is-tall">
                <span className="nx-eb">Vision</span>
                <h2 className="nx-d nx-tcard-h is-l">{copy.visionTitle}</h2>
                <p className="nx-tcard-p">{copy.vision}</p>
              </article>
            )}
            {promises.length > 0 && (
              <article className="nx-tcard is-tall">
                <span className="nx-eb">Promise</span>
                <h2 className="nx-d nx-tcard-h is-l">{copy.promiseTitle}</h2>
                <ul className="nx-ticks">
                  {promises.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        </Block>
      )}

      <section ref={closeRef} className="nx-close nx-reveal">
        <div className="nx-w">
          {copy.closeEntity && <p className="nx-eb">{copy.closeEntity}</p>}
          <h2 className="nx-d nx-close-t">{copy.closeLine || finale.title}</h2>
          {finale.copy && <p className="nx-lede">{finale.copy}</p>}
          <div className="nx-close-a">
            <Link to={finale.primaryCta?.to || '/customize'} className="nx-btn">
              {clean(finale.primaryCta?.label) || 'Customization'}
            </Link>
            <Link to={site.purpose?.to || '/customize/purpose'} className="nx-btn nx-btn-o">
              {site.purpose?.title || 'Shop by purpose'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
