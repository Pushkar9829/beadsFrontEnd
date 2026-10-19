import { useCallback, useState } from 'react';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useSite } from '../store/contentStore';
import { useBrand, pageTitle } from '../store/settingsStore';
import useRefreshOnView from '../hooks/useRefreshOnView';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import { CmsEmpty, CollectionTiles, GridSkeleton, PageHero, StudioBand } from '../components/home/nocturne/Listing';

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

  const load = useCallback(() => {
    api
      .get('/collections')
      .then(({ data }) => setCollections(data.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useRefreshOnView(load);


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

      {loading ? (
        <GridSkeleton />
      ) : collections.length === 0 ? (
        <div className="nx-w nx-sec">
          <CmsEmpty block={copy.empty} />
        </div>
      ) : (
        <CollectionTiles
          eyebrow={copy.listEyebrow || 'Every collection'}
          title={copy.listTitle || 'All collections'}
          items={collections.map((c) => ({
            key: c._id,
            to: `/collection/${c.slug}`,
            title: c.name,
            body: c.description,
            image: c.image ? mediaUrl(c.image) : null,
            kicker: sameAs(c.name, RULE_LABELS[c.ruleType]) ? undefined : RULE_LABELS[c.ruleType],
          }))}
        />
      )}

      <StudioBand />
    </div>
  );
}
