import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { useReveal } from '../components/home/nocturne/Nocturne';
import { EmptyBlock, PageIntro } from '../components/home/nocturne/Listing';

export default function FaqPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.faq || {};
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useReveal();
  const load = useCallback(() => {
    api
      .get('/faqs')
      .then(({ data }) => setFaqs(data.faqs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const title = copy.pageTitle || copy.title || 'FAQ';

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(title, brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageIntro crumbs={[{ label: 'Home', to: '/' }, { label: copy.title || 'FAQ' }]} eyebrow={copy.pageEyebrow || copy.eyebrow} title={title} body={copy.pageBody} />

      <section ref={ref} className="nx-sec nx-reveal">
        <div className="nx-w nx-split">
          <aside className="nx-split-side">
            <p className="nx-eb">Still unsure?</p>
            <p className="nx-lede">Write to us and the atelier will answer personally.</p>
            <Link to="/grievance" className="nx-lnk nx-mt">
              Contact us →
            </Link>
          </aside>
          <div>
            {loading ? (
              <div className="nx-skel nx-faq-skel" />
            ) : !faqs.length ? (
              <EmptyBlock title={copy.emptyBody || 'No questions published yet.'} />
            ) : (
              <div className="nx-faq">
                {faqs.map((f, i) => (
                  <details key={f._id} open={i === 0}>
                    <summary>
                      <span className="nx-faq-n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="nx-faq-q">{f.question}</span>
                    </summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
