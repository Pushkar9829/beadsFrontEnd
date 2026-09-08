import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import { FAMILIES } from '../lib/format';

export default function FamilyPage() {
  const family = useLocation().pathname.replace(/^\//, '');
  const meta = FAMILIES.find((f) => f.slug === family);
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
      <div className="relative shell py-10 sm:py-12 md:py-16">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8">
          <SectionHead
            eyebrow={meta ? `House ${meta.roman}` : 'The house'}
            title={title}
            body={meta?.blurb}
            to="/shop"
            action="Shop all →"
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
                eyebrow="The collection"
                title="Pieces"
                body={`${products.length} ${products.length === 1 ? 'piece' : 'pieces'} from this house.`}
                to="/customize"
                action="Customization →"
              />
            </div>

            {products.length === 0 ? (
              <InViewGroup className="finale-stage mt-10">
                <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
                  <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
                  <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">Nothing listed yet.</h2>
                  <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                    Collections expand from the atelier — or begin a strand in the studio.
                  </p>
                  <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                    <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                    <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
                  </div>
                </div>
              </InViewGroup>
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
