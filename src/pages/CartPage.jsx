import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import QtyControl from '../components/ui/QtyControl';
import Price from '../components/ui/Price';
import { fillCopy } from '../lib/homeContent';
import { useSite } from '../store/contentStore';
import BagLine from '../components/cart/BagLine';
import CouponPicker from '../components/cart/CouponPicker';
import { CmsEmpty, PageIntro } from '../components/home/nocturne/Listing';

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

  async function applyCoupon(e) {
    e.preventDefault();
    setCouponMsg('');
    try {
      const { data } = await api.post('/cart/coupon', { code: coupon });
      setQuote(data.quote);
      setCouponMsg(data.quote?.coupon ? 'Applied.' : data.quote?.couponError || '');
    } catch (err) {
      setCouponMsg(err.message);
    }
  }

  async function removeCoupon() {
    try {
      const { data } = await api.delete('/cart/coupon');
      setQuote(data.quote);
      setCoupon('');
      setCouponMsg('');
    } catch (err) {
      setCouponMsg(err.message);
    }
  }

  const total = quote?.total ?? amount;

  return (
    <div className="nx nx-page">
      <PageIntro
        crumbs={CRUMBS}
        eyebrow={page.eyebrow}
        title={page.title}
        body={items.length ? fillCopy(page.filledBody, { count, pieces: count === 1 ? 'piece' : 'pieces' }) : page.emptyBody}
        actions={
          page.to && (
            <Link to={page.to} className="nx-lnk">
              {String(page.action || 'Shop all').replace(/\s*→\s*$/, '')} →
            </Link>
          )
        }
      />
      <div className="nx-w nx-body">
        {items.length === 0 ? (
          <CmsEmpty block={page.empty} />
        ) : (
          <div className="nx-bag">
            <div className="nx-lines">
              {items.map((item) => (
                <BagLine
                  key={item._id}
                  item={item}
                  aside={
                    <button type="button" className="nx-mini" onClick={() => remove(item._id)}>
                      Remove
                    </button>
                  }
                >
                  {item.kind === 'product' ? (
                    <QtyControl value={item.quantity} min={1} onChange={(n) => updateQty(item._id, n)} />
                  ) : (
                    <Link to="/customize" className="nx-mini is-c">
                      Edit in studio
                    </Link>
                  )}
                </BagLine>
              ))}
            </div>

            <aside className="nx-sum">
              <p className="nx-k">To pay</p>
              <h2 className="nx-sum-t">Checkout.</h2>
              <dl className="nx-rows">
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
                <div className="is-total">
                  <dt>To pay</dt>
                  <dd><Price value={total} /></dd>
                </div>
              </dl>
              <div className="nx-actions">
                <Button to="/checkout" className="nx-btn-block">Checkout</Button>
                <Button to="/shop" variant="ghost" size="s" className="nx-btn-block">Continue shopping</Button>
              </div>

              <div className="nx-part">
                {user && (
                  <form className="nx-inline" onSubmit={applyCoupon}>
                    <input className="nx-input" placeholder="Coupon code" aria-label="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                    <Button type="submit" variant="ghost" size="s">Apply</Button>
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
                  <button type="button" className="nx-mini is-c justify-self-start" onClick={removeCoupon}>
                    Remove {quote.coupon.code}
                  </button>
                )}
                {couponMsg && <p className="nx-msg">{couponMsg}</p>}
              </div>
              <button type="button" onClick={clear} className="nx-mini mt-5">
                Clear bag
              </button>
            </aside>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="nx-paybar">
          <span className="nx-paybar-sum">
            <span>{count} {count === 1 ? 'piece' : 'pieces'} · to pay</span>
            <strong><Price value={total} /></strong>
          </span>
          <Link to="/checkout" className="nx-btn">
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
