import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import { fillCopy, houseMeta } from '../lib/homeContent';
import { useSite } from '../store/contentStore';

export default function FamilyPage() {
  const site = useSite();
  const page = site.pages.family;
  const family = useLocation().pathname.replace(/^\//, '');
  const meta = houseMeta(site, family);
  const [tree, setTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/categories?family=${family}`),
      api.get(`/products?family=${family}`),
    ])
      .then(([c, p]) => {
        setTree(c.data.tree || []);
        setProducts(p.data.products || []);
      })
      .finally(() => setLoading(false));
  }, [family]);

  const children = tree[0]?.children || [];
  const title = meta?.name || family;
  const crumbs = [
    { label: 'Home', to: '/' },
    { label: title },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8">
          <SectionHead
            eyebrow={meta ? `House ${meta.roman}` : 'The house'}
            title={title}
            body={meta?.blurb}
            to={page.shopTo}
            action={page.shopAction}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            {children.length > 0 && (
              <InViewGroup className="studio-grid mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {children.map((c, i) => (
                  <div key={c._id} className="purpose-item" style={{ '--i': i }}>
                    <Link
                      to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`}
                      className="purpose-card group block h-full"
                    >
                      <span className="text-[10px] uppercase tracking-[0.22em] text-gold/80">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-3 font-serif text-xl">{c.name}</h3>
                      {c.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-lilac">{c.description}</p>
                      )}
                      <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold opacity-80 transition group-hover:opacity-100">
                        {c.slug === 'customize-your-bracelet' ? 'Begin →' : 'Enter →'}
                      </p>
                    </Link>
                  </div>
                ))}
              </InViewGroup>
            )}

            <div className="mt-12 sm:mt-16">
              <SectionHead
                eyebrow={page.piecesEyebrow}
                title={page.piecesTitle}
                body={fillCopy(page.piecesBody, {
                  count: products.length,
                  pieces: products.length === 1 ? 'piece' : 'pieces',
                })}
                to={page.piecesTo}
                action={page.piecesAction}
              />
            </div>

            {products.length === 0 ? (
              <CmsFinale block={page.empty} />
            ) : (
              <InViewGroup className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((p, i) => (
                  <div key={p._id} className="feature-item h-full" style={{ '--i': i }}>
                    <ProductCard product={p} description={p.shortDescription} />
                  </div>
                ))}
              </InViewGroup>
            )}
          </>
        )}
      </div>
    </div>
  );
}
