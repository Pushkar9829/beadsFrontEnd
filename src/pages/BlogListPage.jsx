import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES, useReveal } from '../components/home/nocturne/Nocturne';
import { EmptyBlock, PageIntro } from '../components/home/nocturne/Listing';

export const postDate = (p) => {
  const d = new Date(p.publishedAt || p.createdAt);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BlogListPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.journal || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useReveal();
  const load = useCallback(() => {
    api
      .get('/blog')
      .then(({ data }) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const title = copy.pageTitle || copy.title || 'Journal';

  return (
    <div className="nx nx-page at-utility is-stage">
      <SeoHead title={pageTitle(title, brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageIntro crumbs={[{ label: 'Home', to: '/' }, { label: copy.title || 'Journal' }]} eyebrow={copy.pageEyebrow || copy.eyebrow} title={title} body={copy.pageBody} split />

      <section ref={ref} className="nx-sec nx-reveal">
        <div className="nx-w">
          {loading ? (
            <div className="nx-skel nx-post-skel" />
          ) : !posts.length ? (
            <EmptyBlock title={copy.emptyBody || 'No journal entries yet.'} actions={<Link to="/shop" className="nx-btn nx-btn-o">Shop all</Link>} />
          ) : (
            <div className="jr-grid">
              {posts.map((p) => (
                <Link key={p._id} to={`/journal/${p.slug}`} className="luxury-card jr-card">
                  <div className="jr-card-ph">
                    <img src={p.image ? mediaUrl(p.image) : HOUSE_IMAGES.crystals} alt={p.title} loading="lazy" />
                  </div>
                  <div className="jr-card-body">
                    <span className="jr-card-k">{[p.category, postDate(p)].filter(Boolean).join(' · ').toUpperCase()}</span>
                    <h3 className="jr-card-h">{p.title}</h3>
                    {p.excerpt && <p className="jr-card-p">{p.excerpt}</p>}
                    <span className="jr-card-go">Read full article →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
