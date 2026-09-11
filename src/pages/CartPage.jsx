import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import QtyControl from '../components/ui/QtyControl';
import Price from '../components/ui/Price';
import GemVisual from '../components/ui/GemVisual';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';
import CmsFinale from '../components/ui/CmsFinale';
import { fillCopy } from '../lib/homeContent';
import { useSite } from '../store/contentStore';

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
  const page = useSite().pages.cart;
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
            eyebrow={page.eyebrow}
            title={page.title}
            body={
              items.length
                ? fillCopy(page.filledBody, {
                    count,
                    pieces: count === 1 ? 'piece' : 'pieces',
                  })
                : page.emptyBody
            }
            to={page.to}
            action={page.action}
          />
        </div>

        {items.length === 0 ? (
          <CmsFinale block={page.empty} className="mt-8 sm:mt-10" />
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
