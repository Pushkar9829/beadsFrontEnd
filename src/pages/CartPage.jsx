import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import QtyControl from '../components/ui/QtyControl';
import Price from '../components/ui/Price';
import GemVisual from '../components/ui/GemVisual';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Bag' },
];

function itemTitle(item) {
  const snap = item.snapshot || {};
  if (item.kind === 'custom_bracelet') {
    return snap.name || `Custom bracelet · ${snap.intention?.name || 'Intention'}`;
  }
  return snap.name || 'Piece';
}

function itemMeta(item) {
  const snap = item.snapshot || {};
  if (item.kind !== 'custom_bracelet') return '';
  const parts = [];
  if (snap.purpose?.name) parts.push(snap.purpose.name);
  if (snap.intention?.name && snap.intention.name !== snap.purpose?.name) {
    parts.push(snap.intention.name);
  }
  if (snap.charm?.name) parts.push(snap.charm.name);
  if (snap.mulank) parts.push(`Mulank ${snap.mulank}`);
  if (snap.zodiac?.sign) parts.push(snap.zodiac.sign);
  if (snap.finish?.label && snap.finish.label !== 'Gold') parts.push(snap.finish.label);
  if (snap.wristSize) parts.push(snap.wristSize);
  const beads = snap.beads
    ?.map((b) => (b.name ? `${b.name} × ${b.quantity}` : ''))
    .filter(Boolean);
  if (beads?.length) parts.push(beads.join(' · '));
  return parts.join(' · ');
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const amount = useCartStore((s) => s.items.reduce((n, i) => n + i.lineTotal, 0));
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className={`cart-page relative ${items.length ? 'is-filled' : 'is-empty'}`}>
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell cart-shell">
        <Breadcrumbs items={CRUMBS} />

        <div className="cart-head">
          <SectionHead
            eyebrow="The atelier"
            title="Bag"
            body={
              items.length
                ? `${count} ${count === 1 ? 'piece' : 'pieces'} held for checkout — ready-made or composed in the studio.`
                : 'Your bag is empty. Begin a custom strand, or walk the three houses until a piece finds you.'
            }
            to="/shop"
            action="Shop all →"
          />
        </div>

        {items.length === 0 ? (
          <InViewGroup className="finale-stage mt-8 sm:mt-10">
            <div className="finale px-5 py-12 text-center sm:px-8 sm:py-16">
              <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Empty</p>
              <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">Your bag is empty.</h2>
              <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
                Begin a custom strand or browse the houses.
              </p>
              <div className="finale-actions mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:mt-8">
                <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
                <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
              </div>
            </div>
          </InViewGroup>
        ) : (
          <div className="bag-stage">
            <InViewGroup className="bag-list">
              {items.map((item, i) => {
                const snap = item.snapshot || {};
                const title = itemTitle(item);
                const meta = itemMeta(item);
                const href = item.kind === 'product' && snap.slug ? `/p/${snap.slug}` : null;
                const kindLabel = item.kind === 'custom_bracelet' ? 'Studio' : snap.family || 'House';
                const media = (
                  <GemVisual
                    color={snap.colorHex || snap.beads?.[0]?.colorHex}
                    image={snap.image}
                    className="h-full w-full"
                    name={title}
                  />
                );

                return (
                  <article key={item._id} className="bag-item bag-card" style={{ '--i': i }}>
                    <div className="bag-card-media">
                      {href ? (
                        <Link to={href} className="block h-full w-full">
                          {media}
                        </Link>
                      ) : (
                        media
                      )}
                    </div>
                    <div className="bag-card-body">
                      <p className="bag-card-kind">{kindLabel}</p>
                      {href ? (
                        <Link to={href}>
                          <h3 className="bag-card-title">{title}</h3>
                        </Link>
                      ) : (
                        <h3 className="bag-card-title">{title}</h3>
                      )}
                      {meta && <p className="bag-card-meta">{meta}</p>}
                      <div className="bag-card-foot">
                        {item.kind === 'product' ? (
                          <QtyControl value={item.quantity} min={1} onChange={(n) => updateQty(item._id, n)} />
                        ) : (
                          <Link to="/customize" className="bag-card-edit">
                            Edit in studio
                          </Link>
                        )}
                        <div className="bag-card-price-row">
                          <Price value={item.lineTotal} className="text-gold" />
                          <button type="button" onClick={() => remove(item._id)} className="bag-card-remove">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </InViewGroup>

            <aside className="bag-summary">
              <p className="bag-summary-kicker">To pay</p>
              <h2 className="bag-summary-title gold-text">Checkout.</h2>
              <dl className="bag-summary-rows">
                <div>
                  <dt>Pieces</dt>
                  <dd>{count}</dd>
                </div>
                <div>
                  <dt>Subtotal</dt>
                  <dd className="bag-summary-total">
                    <Price value={amount} />
                  </dd>
                </div>
              </dl>
              <div className="bag-summary-actions">
                <Button to="/checkout" className="w-full">Checkout</Button>
                <Button to="/shop" variant="ghost" className="w-full">Continue shopping</Button>
                <button type="button" onClick={clear} className="bag-summary-clear">
                  Clear bag
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
