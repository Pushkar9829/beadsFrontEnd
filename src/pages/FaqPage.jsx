import { useCallback, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function FaqPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.faq || {};
  const [faqs, setFaqs] = useState([]);
  const load = useCallback(() => {
    api.get('/faqs').then(({ data }) => setFaqs(data.faqs || [])).catch(() => {});
  }, []);
  useRefreshOnView(load);

  return (
    <div className="shell py-10">
      <SeoHead title={pageTitle(copy.pageTitle || copy.title || 'FAQ', brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: copy.title || 'FAQ' }]} />
      <div className="mt-8">
        <SectionHead eyebrow={copy.pageEyebrow || copy.eyebrow} title={copy.pageTitle || copy.title} body={copy.pageBody} />
      </div>
      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <article key={f._id} className="rounded-2xl border border-gold/20 bg-surface p-5">
            <h2 className="font-serif text-lg gold-text">{f.question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-lilac">{f.answer}</p>
          </article>
        ))}
        {!faqs.length && <p className="text-lilac">{copy.emptyBody || 'No questions published yet.'}</p>}
      </div>
    </div>
  );
}
