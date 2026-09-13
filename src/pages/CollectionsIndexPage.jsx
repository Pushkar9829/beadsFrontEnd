import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <SeoHead title="Collections · Kuberstones" description="Best sellers, new arrivals, and curated rooms." />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
        <div className="mt-8">
          <SectionHead eyebrow="The rooms" title="Collections" body="Rule-based rooms that stay in step with what you sell — best sellers, new arrivals, and the rest." />
        </div>
        {loading ? <Spinner /> : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link key={c._id} to={`/collection/${c.slug}`} className="rounded-2xl border border-gold/20 bg-surface p-5 transition hover:border-gold/45">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{c.ruleType === 'manual' ? 'Curated' : 'Rule'}</p>
                <h2 className="mt-2 font-serif text-xl gold-text">{c.name}</h2>
                {c.description && <p className="mt-2 text-sm text-lilac">{c.description}</p>}
                <p className="mt-4 text-[11px] uppercase tracking-widest text-gold">Enter →</p>
              </Link>
            ))}
            {!collections.length && <p className="text-lilac">No collections published yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
