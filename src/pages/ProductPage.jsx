import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Button from '../components/ui/Button';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import QtyControl from '../components/ui/QtyControl';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useCartStore } from '../store/cartStore';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addProduct = useCartStore((s) => s.addProduct);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(({ data }) => setProduct(data.product)).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (!product) return <EmptyState title="Piece not found" />;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2">
      <GemVisual color={product.colorHex} image={product.images?.[0]} name={product.name} className="h-[420px] w-full rounded-3xl gold-border" />
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">{product.family}</p>
        <h1 className="mt-2 font-serif text-4xl gold-text">{product.name}</h1>
        <p className="mt-2 text-lilac">{product.shortDescription}</p>
        <p className="mt-4 font-serif text-3xl text-gold"><Price value={product.price} /></p>
        {product.compareAtPrice && (
          <p className="text-sm text-lilac line-through"><Price value={product.compareAtPrice} /></p>
        )}
        <p className="mt-6 leading-relaxed text-ivory/80">{product.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <QtyControl value={qty} min={1} onChange={setQty} />
          <Button
            onClick={async () => {
              await addProduct(product, qty);
              setAdded(true);
            }}
          >
            Add to cart
          </Button>
        </div>
        {added && <p className="mt-3 text-sm text-gold">Added to bag.</p>}
        <div className="mt-10 rounded-2xl p-5 gold-border">
          <p className="text-sm text-lilac">Want this feeling in your own bead counts?</p>
          <Button to="/customize" className="mt-3">Shop by Purpose</Button>
        </div>
      </div>
    </div>
  );
}
