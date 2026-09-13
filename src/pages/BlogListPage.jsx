import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get('/blog').then(({ data }) => setPosts(data.posts || [])).catch(() => {});
  }, []);

  return (
    <div className="shell py-10">
      <SeoHead title="Journal · Kuberstones" description="Notes from the atelier." />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journal' }]} />
      <div className="mt-8">
        <SectionHead eyebrow="Journal" title="From the atelier" body="Quiet writing on stones, ritual, and making." />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Link key={p._id} to={`/journal/${p.slug}`} className="rounded-2xl border border-gold/20 bg-surface p-5 hover:border-gold/40">
            {p.image && <img src={mediaUrl(p.image)} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />}
            <h2 className="font-serif text-xl gold-text">{p.title}</h2>
            <p className="mt-2 text-sm text-lilac">{p.excerpt}</p>
          </Link>
        ))}
        {!posts.length && <p className="text-lilac">No journal entries yet.</p>}
      </div>
    </div>
  );
}
