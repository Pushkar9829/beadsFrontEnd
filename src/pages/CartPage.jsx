import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import QtyControl from '../components/ui/QtyControl';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';
import GemVisual from '../components/ui/GemVisual';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const amount = useCartStore((s) => s.items.reduce((n, i) => n + i.lineTotal, 0));

  if (!items.length) {
    return (
      <EmptyState title="Your bag is empty" body="Begin a custom strand or browse the houses.">
        <Button to="/customize">Customize Your Bracelet</Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl gold-text">Bag</h1>
        <Button variant="text" onClick={clear}>Clear</Button>
      </div>
      <ul className="mt-8 space-y-4">
        {items.map((item) => {
          const snap = item.snapshot || {};
          const title = item.kind === 'custom_bracelet'
            ? `Custom bracelet · ${snap.intention?.name || 'Intention'}`
            : snap.name;
          return (
            <li key={item._id} className="flex gap-4 rounded-2xl p-4 gold-border">
              <GemVisual
                color={snap.colorHex || snap.beads?.[0]?.colorHex}
                image={snap.image}
                className="h-20 w-20 rounded-xl"
                name={title}
              />
              <div className="flex-1">
                <h3 className="font-serif text-lg">{title}</h3>
                {item.kind === 'custom_bracelet' && (
                  <p className="text-xs text-lilac">
                    {snap.beads?.map((b) => `${b.name} × ${b.quantity}`).join(' · ')} · {snap.finish?.label} · {snap.wristSize}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  {item.kind === 'product' ? (
                    <QtyControl value={item.quantity} min={1} onChange={(n) => updateQty(item._id, n)} />
                  ) : (
                    <Link to="/customize" className="text-xs uppercase tracking-widest text-gold">Edit in studio</Link>
                  )}
                  <div className="flex items-center gap-4">
                    <Price value={item.lineTotal} className="text-gold" />
                    <button type="button" onClick={() => remove(item._id)} className="text-xs text-lilac hover:text-ivory">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex items-center justify-between border-t border-gold/20 pt-6">
        <span className="font-serif text-2xl text-gold">Total <Price value={amount} /></span>
        <Button to="/checkout">Checkout</Button>
      </div>
    </div>
  );
}
