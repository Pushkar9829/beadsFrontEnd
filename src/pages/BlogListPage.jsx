import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

  const [lead, ...rest] = posts;
  const title = copy.pageTitle || copy.title || 'Journal';

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(title, brand)} description={copy.pageBody} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageIntro crumbs={[{ label: 'Home', to: '/' }, { label: copy.title || 'Journal' }]} eyebrow={copy.pageEyebrow || copy.eyebrow} title={title} body={copy.pageBody} />

      <section ref={ref} className="nx-sec nx-reveal">
        <div className="nx-w">
          {loading ? (
            <div className="nx-skel nx-post-skel" />
          ) : !posts.length ? (
            <EmptyBlock title={copy.emptyBody || 'No journal entries yet.'} actions={<Link to="/shop" className="nx-btn nx-btn-o">Shop all</Link>} />
          ) : (
            <>
              <Link to={`/journal/${lead.slug}`} className="nx-post-lead">
                <span className="nx-post-ph">
                  <img src={lead.image ? mediaUrl(lead.image) : HOUSE_IMAGES.crystals} alt="" />
                </span>
                <span className="nx-post-c">
                  <span className="nx-post-k">
                    Latest · {postDate(lead)}
                  </span>
                  <span className="nx-d nx-post-lh">{lead.title}</span>
                  {lead.excerpt && <span className="nx-post-p">{lead.excerpt}</span>}
                  <span className="nx-lnk nx-post-go">
                    Read the note <ArrowRight size={13} style={{ display: 'inline', verticalAlign: '-2px' }} />
                  </span>
                </span>
              </Link>
              {rest.length > 0 && (
                <div className="nx-posts">
                  {rest.map((p) => (
                    <Link key={p._id} to={`/journal/${p.slug}`} className="nx-post">
                      <span className="nx-post-ph">
                        <img src={p.image ? mediaUrl(p.image) : HOUSE_IMAGES.gemstones} alt="" loading="lazy" />
                      </span>
                      <span className="nx-post-k">{postDate(p)}</span>
                      <span className="nx-d nx-post-h">{p.title}</span>
                      {p.excerpt && <span className="nx-post-p">{p.excerpt}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
