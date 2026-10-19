// FAQ, ported from beeds_ecommerce/src/pages/InfoPages.jsx (type "faq"): eyebrow, "FREQUENTLY asked
// questions" title and one open card per question. Questions: admin → FAQs; heading: Site pages → Reviews.
import { useCallback, useState } from 'react';
import api from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function FaqPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.faq || {};
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    api
      .get('/faqs')
      .then(({ data }) => setFaqs(data.faqs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const lead = copy.heading || 'FREQUENTLY';
  const tail = copy.headingTail ?? 'asked questions';

  return (
    <div className="info-page">
      <SeoHead title={pageTitle(`${lead} ${tail}`.trim(), brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="container-custom info-narrow">
        {copy.kicker && <span className="section-eyebrow">{copy.kicker}</span>}
        <h1 className="section-title info-title is-faq">
          {lead} {tail && <span className="gold-italic">{tail}</span>}
        </h1>

        {loading ? null : !faqs.length ? (
          <p className="info-faq-a">{copy.emptyBody || 'No questions published yet.'}</p>
        ) : (
          <div className="info-faq-list">
            {faqs.map((f) => (
              <div key={f._id} id={f._id} className="info-faq">
                <h3 className="info-faq-q">{f.question}</h3>
                <p className="info-faq-a">{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
