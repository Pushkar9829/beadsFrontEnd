import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
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
import CouponPicker from '../components/cart/CouponPicker';
import { itemMeta, itemTitle } from '../lib/cartItems';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Bag' },
];

export default function CartPage() {
  const page = useSite().pages.cart;
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const amount = useCartStore((s) => s.items.reduce((n, i) => n + i.lineTotal, 0));
  const user = useAuthStore((s) => s.user);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const [quote, setQuote] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    if (!user || !items.length) return;
    api.get('/checkout/quote').then(({ data }) => {
      setQuote(data.quote);
      if (data.quote?.coupon?.code) setCoupon(data.quote.coupon.code);
    }).catch(() => {});
  }, [user, items.length, amount]);

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
              {user && (
                <form
                  className="mb-3 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCouponMsg('');
                    try {
                      const { data } = await api.post('/cart/coupon', { code: coupon });
                      setQuote(data.quote);
                      setCouponMsg(data.quote?.coupon ? 'Applied.' : data.quote?.couponError || '');
                    } catch (err) {
                      setCouponMsg(err.message);
                    }
                  }}
                >
                  <input className="flex-1 rounded-xl border border-gold/30 bg-ink px-3 py-2 text-sm text-ivory" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button type="submit" className="text-xs uppercase tracking-widest text-gold">Apply</button>
                </form>
              )}
              <CouponPicker
                signedIn={!!user}
                appliedCode={quote?.coupon?.code || coupon}
                refreshKey={`${items.length}-${amount}`}
                onQuote={(next, message) => {
                  if (next) {
                    setQuote(next);
                    if (next.coupon?.code) setCoupon(next.coupon.code);
                  }
                  if (message) setCouponMsg(message);
                }}
              />
              {quote?.coupon?.code && user && (
                <button
                  type="button"
                  className="mb-3 text-[11px] uppercase tracking-widest text-gold"
                  onClick={async () => {
                    try {
                      const { data } = await api.delete('/cart/coupon');
                      setQuote(data.quote);
                      setCoupon('');
                      setCouponMsg('');
                    } catch (err) {
                      setCouponMsg(err.message);
                    }
                  }}
                >
                  Remove {quote.coupon.code}
                </button>
              )}
              {couponMsg && <p className="mb-2 text-xs text-lilac">{couponMsg}</p>}
              <dl className="bag-summary-rows">
                <div>
                  <dt>Pieces</dt>
                  <dd>{count}</dd>
                </div>
                <div>
                  <dt>Subtotal</dt>
                  <dd><Price value={quote?.subtotal ?? amount} /></dd>
                </div>
                {quote?.discount ? (
                  <div>
                    <dt>{quote.coupon?.code ? `Coupon (${quote.coupon.code})` : quote.offer?.discount ? `Offer (${quote.offer.name})` : 'Discount'}</dt>
                    <dd>-<Price value={quote.discount} /></dd>
                  </div>
                ) : null}
                {quote?.offer?.freeShipping && !quote?.discount ? (
                  <div>
                    <dt>Offer</dt>
                    <dd>{quote.offer.name}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Shipping</dt>
                  <dd>{quote ? (quote.shippingFee ? <Price value={quote.shippingFee} /> : 'Calculated at checkout') : 'At checkout'}</dd>
                </div>
                {quote?.tax ? (
                  <div>
                    <dt>GST</dt>
                    <dd><Price value={quote.tax} /></dd>
                  </div>
                ) : null}
                <div>
                  <dt>To pay</dt>
                  <dd className="bag-summary-total">
                    <Price value={quote?.total ?? amount} />
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
