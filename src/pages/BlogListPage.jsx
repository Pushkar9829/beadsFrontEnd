import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';

export default function BlogListPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.journal || {};
  const [posts, setPosts] = useState([]);
  const load = useCallback(() => {
    api.get('/blog').then(({ data }) => setPosts(data.posts || [])).catch(() => {});
  }, []);
  useRefreshOnView(load);

  return (
    <div className="shell py-10">
      <SeoHead title={pageTitle(copy.pageTitle || copy.title || 'Journal', brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: copy.title || 'Journal' }]} />
      <div className="mt-8">
        <SectionHead eyebrow={copy.pageEyebrow || copy.eyebrow} title={copy.pageTitle || copy.title} body={copy.pageBody} />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Link key={p._id} to={`/journal/${p.slug}`} className="rounded-2xl border border-gold/20 bg-surface p-5 hover:border-gold/40">
            {p.image && <img src={mediaUrl(p.image)} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />}
            <h2 className="font-serif text-xl gold-text">{p.title}</h2>
            <p className="mt-2 text-sm text-lilac">{p.excerpt}</p>
          </Link>
        ))}
        {!posts.length && <p className="text-lilac">{copy.emptyBody || 'No journal entries yet.'}</p>}
      </div>
    </div>
  );
}
