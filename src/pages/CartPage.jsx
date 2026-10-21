// Bag page. The source has no bag page: `#bag` opens the bag drawer (beeds_ecommerce/src/components/CartDrawer.jsx),
// so this page renders the drawer panel (header, free-shipping bar, item rows, Checkout / Continue shopping footer)
// on the checkout stage. Copy: admin → Site pages → Bag. Styles: styles/atelier/commerce.css "Bag".
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, Sparkles, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSite } from '../store/contentStore';
import { fillCopy } from '../lib/homeContent';
import { formatInr } from '../lib/format';
import { itemMeta, itemTitle } from '../lib/cartItems';
import GemVisual from '../components/ui/GemVisual';
import { showToast } from '../components/layout/QuickToast';
import emblem from '../assets/brand/emblem.png';

const clean = (s) => String(s || '').replace(/\s*→\s*$/, '');

/**
 * Free-shipping state for the bag bar, by the same rule the server applies in the checkout quote
 * (backend checkoutService.quote; shown by CheckoutPage's delivery line): an active free-shipping
 * offer makes delivery free; otherwise it is free once the subtotal after discounts reaches the
 * store threshold. Null when neither applies (no bar).
 */
function shippingProgress(quote, amount) {
  if (!quote) return null;
  if (quote.offer?.freeShipping) return { free: true, remaining: 0 };
  const threshold = Number(quote.settings?.freeThreshold || 0);
  if (threshold <= 0) return null;
  const subtotal = Number.isFinite(Number(quote.subtotal)) ? Number(quote.subtotal) : amount;
  const base = Math.max(0, subtotal - (Number(quote.discount) || 0));
  return base >= threshold ? { free: true, remaining: 0 } : { free: false, remaining: threshold - base };
}

export default function CartPage() {
  const page = useSite().pages.cart;
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const amount = useCartStore((s) => s.items.reduce((n, i) => n + i.lineTotal, 0));
  const user = useAuthStore((s) => s.user);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const [quote, setQuote] = useState(null);
  const empty = page.empty || {};
  const shopTo = page.to || '/shop';

  // Free shipping follows the checkout quote, the same source of truth as the checkout delivery line:
  // free when an active free-shipping offer applies, or when the discounted subtotal reaches the
  // threshold (admin → Settings → Shipping). See shippingProgress below.
  useEffect(() => {
    if (!user || !items.length) return;
    api.get('/checkout/quote').then(({ data }) => setQuote(data.quote || null)).catch(() => {});
  }, [user, items.length, amount]);
  const ship = shippingProgress(quote, amount);

  return (
    <div className="bag-page">
      <div className="bag-panel">
        {/* Header (source lines 70-126) */}
        <div className="bag-head">
          <div>
            <span className="bag-eyebrow">{page.eyebrow || 'Your bag'}</span>
            <h1 className="bag-title">{page.title || 'BAG.'}</h1>
            <p className="bag-count">
              {items.length
                ? fillCopy(page.filledBody, { count, pieces: count === 1 ? 'piece' : 'pieces' })
                : page.emptyBody}
            </p>
          </div>
          <Link to={shopTo} className="bag-close" aria-label="Close Bag">
            <X size={18} />
          </Link>
        </div>

        {/* Free shipping progress (source lines 128-145) */}
        {ship && items.length > 0 && (
          <div className="bag-ship">
            <Sparkles size={14} />
            <span>{ship.free ? '✨ You have unlocked Free Insured Shipping!' : `Add ${formatInr(ship.remaining)} more for Free Insured Shipping`}</span>
          </div>
        )}

        {/* Items (source lines 147-307) */}
        <div className="bag-items">
          {items.length === 0 ? (
            <div className="bag-empty">
              <img src={emblem} alt="Kuberstones" className="bag-empty-logo" />
              <h3 className="bag-empty-t">{empty.title || 'Your Bag is Empty'}</h3>
              {empty.copy && <p className="bag-empty-p">{empty.copy}</p>}
              <Link to={empty.primaryCta?.to || '/shop'} className="btn-gold">
                {clean(empty.primaryCta?.label) || 'Explore All Pieces'}
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const snap = item.snapshot || {};
              const title = itemTitle(item);
              const meta = itemMeta(item);
              const href = item.kind === 'product' && snap.slug ? `/p/${snap.slug}` : null;
              return (
                <div key={item._id} className="bag-item">
                  <div className="bag-thumb">
                    <GemVisual color={snap.colorHex || snap.beads?.[0]?.colorHex} image={snap.image} className="bag-thumb-img" name={title} />
                  </div>
                  <div className="bag-item-body">
                    <span className="bag-cat">{item.kind === 'custom_bracelet' ? 'Studio' : snap.family || 'Crystals'}</span>
                    <h4 className="bag-name">{href ? <Link to={href}>{title}</Link> : title}</h4>
                    {meta && <p className="bag-meta">{meta}</p>}
                    <div className="bag-item-row">
                      {item.kind === 'product' ? (
                        <div className="bag-stepper">
                          <button type="button" onClick={() => updateQty(item._id, Math.max(1, item.quantity - 1))} aria-label="Decrease quantity">
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQty(item._id, Math.min(99, item.quantity + 1))} aria-label="Increase quantity">
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <Link to="/customize" className="bag-edit">
                          Edit in studio
                        </Link>
                      )}
                      <div className="bag-item-end">
                        <span className="bag-price">{formatInr(item.lineTotal)}</span>
                        <button type="button" className="bag-remove" onClick={() => { remove(item._id); showToast('Piece removed from bag', 'muted'); }}>
                          <Trash2 size={13} />
                          <span>REMOVE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer (source lines 309-341) */}
        {items.length > 0 && (
          <div className="bag-foot">
            <Link to="/checkout" className="btn-gold bag-checkout">
              <span>Checkout</span>
              <ArrowRight size={16} />
            </Link>
            <Link to={shopTo} className="btn-outline bag-continue">
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
