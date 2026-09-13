import { useEffect, useState } from 'react';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  useEffect(() => {
    api.get('/faqs').then(({ data }) => setFaqs(data.faqs || [])).catch(() => {});
  }, []);

  return (
    <div className="shell py-10">
      <SeoHead title="FAQ · Kuberstones" />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />
      <div className="mt-8">
        <SectionHead eyebrow="Care" title="Questions, answered quietly." />
      </div>
      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <article key={f._id} className="rounded-2xl border border-gold/20 bg-surface p-5">
            <h2 className="font-serif text-lg gold-text">{f.question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-lilac">{f.answer}</p>
          </article>
        ))}
        {!faqs.length && <p className="text-lilac">No questions published yet.</p>}
      </div>
    </div>
  );
}
