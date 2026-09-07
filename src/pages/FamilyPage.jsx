import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
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

  if (loading) return <Spinner />;
  const children = tree[0]?.children || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">House</p>
      <h1 className="mt-2 font-serif text-4xl gold-text">{meta?.name || family}</h1>
      <p className="mt-3 max-w-2xl text-lilac">{meta?.blurb}</p>
      <div className="mt-6">
        <Button to="/customize">Customize Your Bracelet</Button>
      </div>

      {children.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {children.map((c) => (
            <Link key={c._id} to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`}>
              <Card className="p-5">
                <h3 className="font-serif text-xl">{c.name}</h3>
                <p className="mt-2 text-sm text-lilac">{c.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-12 font-serif text-2xl">Pieces</h2>
      {products.length === 0 ? (
        <EmptyState title="Nothing listed yet" body="Collections expand from the atelier — they are never hard-coded." />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p._id} to={`/p/${p.slug}`}>
              <Card className="overflow-hidden">
                <GemVisual color={p.colorHex} image={p.images?.[0]} className="h-44 w-full" name={p.name} />
                <div className="p-4">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <p className="text-gold"><Price value={p.price} /></p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
