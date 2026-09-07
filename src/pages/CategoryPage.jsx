import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMissing(false);
    Promise.all([api.get(`/categories/${slug}`), api.get(`/products?category=${slug}`)])
      .then(([c, p]) => {
        setCategory(c.data.category);
        setProducts(p.data.products || []);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (missing) return <EmptyState title="Collection not found" body="This category is not published yet." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">{category.family}</p>
      <h1 className="mt-2 font-serif text-4xl gold-text">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-lilac">{category.description}</p>
      <Button to="/customize" className="mt-6">Customize Your Bracelet</Button>
      {products.length === 0 ? (
        <EmptyState title="No pieces in this collection yet" body="The atelier will add them from admin — the menu stays expandable." />
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p._id} to={`/p/${p.slug}`}>
              <Card className="overflow-hidden">
                <GemVisual color={p.colorHex} image={p.images?.[0]} className="h-48 w-full" name={p.name} />
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
