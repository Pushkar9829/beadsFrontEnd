import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES, useReveal } from '../components/home/nocturne/Nocturne';
import { CmsEmpty, PageHero, StudioBand } from '../components/home/nocturne/Listing';

const RULE_LABELS = {
  manual: 'Curated',
  bestsellers: 'Best sellers',
  new_arrivals: 'New in',
  trending: 'Trending',
  featured: 'Editor’s pick',
  under_price: 'By price',
};

// Skip the kind label when the collection's name already says it ("Best sellers").
const sameAs = (name = '', label = '') => Boolean(label) && name.toLowerCase().includes(label.toLowerCase());

export default function CollectionsIndexPage() {
  const site = useSite();
  const brand = useBrand();
  const copy = site.pages.collections || {};
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useReveal();

  const load = useCallback(() => {
    api
      .get('/collections')
      .then(({ data }) => setCollections(data.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);

  const action = String(copy.action || 'Enter').replace(/\s*→\s*$/, '');

  return (
    <div className="nx nx-page">
      <SeoHead title={pageTitle(copy.title || 'Collections', brand)} description={copy.body} keywords={brand.seo?.keywords} image={brand.seo?.ogImage} noIndex={brand.seo?.noIndex} />
      <PageHero
        size="short"
        image={copy.image ? mediaUrl(copy.image) : HOUSE_IMAGES.rudraksha}
        crumbs={[{ label: 'Home', to: '/' }, { label: copy.title || 'Collections' }]}
        eyebrow={copy.eyebrow}
        title={copy.title || 'Collections'}
        body={copy.body}
        meta={loading ? [] : [`${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`]}
      />

      <section ref={ref} className="nx-sec nx-reveal">
        <div className="nx-w">
          {loading ? (
            <div className="nx-rooms">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="nx-skel nx-room-skel" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <CmsEmpty block={copy.empty} />
          ) : (
            <ol className="nx-rooms">
              {collections.map((c, i) => (
                <li key={c._id}>
                  <Link to={`/collection/${c.slug}`} className={`nx-room${c.image ? ' has-img' : ''}`}>
                    <span className="nx-room-n">{String(i + 1).padStart(2, '0')}</span>
                    {c.image && <img src={mediaUrl(c.image)} alt="" loading="lazy" className="nx-room-img" />}
                    <span className="nx-room-c">
                      {!sameAs(c.name, RULE_LABELS[c.ruleType]) && <span className="nx-room-k">{RULE_LABELS[c.ruleType] || 'Collection'}</span>}
                      <span className="nx-d nx-room-h">{c.name}</span>
                      {c.description && <span className="nx-room-p">{c.description}</span>}
                    </span>
                    <span className="nx-room-go">
                      <span>{action}</span>
                      <span className="nx-arrow" aria-hidden>
                        <ArrowRight size={16} strokeWidth={1.5} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <StudioBand />
    </div>
  );
}
