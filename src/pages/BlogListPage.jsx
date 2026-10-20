// Journal, ported from beeds_ecommerce/src/pages/InfoPages.jsx (type "journal", lines 8-102): purple stage,
// centred eyebrow + "THE journal" title + one line, then the card grid. Header copy: admin → Site pages → Journal;
// posts: admin → Journal. Styles: styles/atelier/info.css "Journal".
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';

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
  const load = useCallback(() => {
    api
      .get('/blog')
      .then(({ data }) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const title = copy.pageTitle || copy.title || 'Journal';
  const tail = copy.headingTail ?? 'journal';

  return (
    <div className="info-jr-page">
      <SeoHead title={pageTitle(title, brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <div className="container-custom">
        <div className="jr-head">
          {copy.kicker && <span className="section-eyebrow">{copy.kicker}</span>}
          <h1 className="section-title">
            {copy.heading || 'THE'} {tail && <span className="gold-italic">{tail}</span>}
          </h1>
          {copy.intro && <p className="jr-head-p">{copy.intro}</p>}
        </div>

        {loading ? null : !posts.length ? (
          <p className="info-jr-empty">{copy.emptyBody || 'No journal entries yet.'}</p>
        ) : (
          <div className="info-jr-grid">
            {posts.map((p) => (
              <Link key={p._id} to={`/journal/${p.slug}`} className="luxury-card info-jr-card">
                <div className="info-jr-ph">
                  <img src={p.image ? mediaUrl(p.image) : HOUSE_IMAGES.crystals} alt={p.title} loading="lazy" />
                </div>
                <div className="info-jr-body">
                  <span className="info-jr-k">{[p.category, postDate(p)].filter(Boolean).join(' · ').toUpperCase()}</span>
                  <h3 className="info-jr-h">{p.title}</h3>
                  {p.excerpt && <p className="info-jr-p">{p.excerpt}</p>}
                  <span className="info-jr-go">Read full article →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
