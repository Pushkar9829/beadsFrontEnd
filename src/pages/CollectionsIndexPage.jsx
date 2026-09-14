import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import CmsFinale from '../components/ui/CmsFinale';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function CollectionsIndexPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.pages.collections || {};
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  return (
    <div className="relative">
      <SeoHead title={pageTitle(copy.title || 'Collections', brand)} description={copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: copy.title || 'Collections' }]} />
        <div className="mt-8">
          <SectionHead eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
        </div>
        {loading ? <Spinner /> : collections.length === 0 ? (
          <CmsFinale block={copy.empty} />
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link key={c._id} to={`/collection/${c.slug}`} className="overflow-hidden rounded-2xl border border-gold/20 bg-surface transition hover:border-gold/45">
                {c.image ? (
                  <img src={mediaUrl(c.image)} alt="" className="h-40 w-full object-cover" />
                ) : null}
                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{c.ruleType === 'manual' ? 'Curated' : 'Rule'}</p>
                  <h2 className="mt-2 font-serif text-xl gold-text">{c.name}</h2>
                  {c.description && <p className="mt-2 text-sm text-lilac">{c.description}</p>}
                  <p className="mt-4 text-[11px] uppercase tracking-widest text-gold">{copy.action || 'Enter →'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
