import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Popup from '../ui/Popup';
import { showToast } from '../layout/QuickToast';

function audienceNote(audience) {
  if (audience === 'new') return 'First order';
  if (audience === 'existing') return 'Returning customers';
  return '';
}

export default function CouponPicker({ appliedCode, onQuote, onRemove, signedIn, refreshKey, fromPath = '/checkout' }) {
  const [coupons, setCoupons] = useState([]);
  const [count, setCount] = useState(0);
  const [usableCount, setUsableCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.get('/coupons')
      .then(({ data }) => {
        setCoupons(data.coupons || []);
        setCount(data.count || 0);
        setUsableCount(data.usableCount || 0);
      })
      .catch(() => {
        setCoupons([]);
        setCount(0);
        setUsableCount(0);
      });
  }, [appliedCode, refreshKey]);

  async function apply(code) {
    if (!signedIn) return;
    setBusy(code);
    try {
      const { data } = await api.post('/cart/coupon', { code });
      if (data.quote?.coupon) {
        onQuote?.(data.quote, '');
        showToast(`✨ Coupon ${data.quote.coupon.code} applied!`, 'gold');
        setOpen(false);
      } else {
        onQuote?.(data.quote, data.quote?.couponError || '');
      }
    } catch (err) {
      onQuote?.(null, err.message || 'Could not apply this coupon.');
    } finally {
      setBusy('');
    }
  }

  const noun = count === 1 ? 'coupon' : 'coupons';
  const usableLabel = !count
    ? 'No coupons available'
    : signedIn
      ? `${usableCount} eligible · ${count} ${noun}`
      : `${count} ${noun} available`;

  // Source: CheckoutPage.jsx lines 428-458 (sub-bar) and 786-915 (coupons popup).
  return (
    <>
      <div className="co-coupon-bar">
        <div className="co-coupon-count">
          <Tag size={12} color="#D9AE4F" />
          <span>{usableLabel}</span>
        </div>
        {count > 0 && (
          <button type="button" className="co-see-all" onClick={() => setOpen(true)}>
            SEE ALL
          </button>
        )}
      </div>

      {open && (
        <Popup eyebrow="Available offers" title={`${count} Sacred ${count === 1 ? 'Coupon' : 'Coupons'}`} titleId="coupon-modal-title" label="Close coupons" onClose={() => setOpen(false)}>
          <div className="co-cpn-list">
            {coupons.map((c) => {
              const applied = appliedCode && appliedCode.toUpperCase() === c.code;
              const eligible = Boolean(c.usable);
              const canApply = signedIn && eligible && !applied && !busy;
              const note = [
                c.minOrder ? `Min ₹${Number(c.minOrder).toLocaleString('en-IN')}` : 'No minimum',
                audienceNote(c.audience),
                c.endsAt ? `till ${new Date(c.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : '',
                !eligible && c.reason ? c.reason : '',
              ].filter(Boolean).join(' · ');
              return (
                <div key={c.code} className={`co-cpn${applied ? ' is-on' : ''}${eligible ? '' : ' is-locked'}`}>
                  <div>
                    <div className="co-cpn-head">
                      <span className="co-cpn-code">{c.code}</span>
                      <span className="co-cpn-title">{c.label}</span>
                    </div>
                    <p className="co-cpn-desc">{note}</p>
                  </div>
                  {applied ? (
                    <button type="button" className="co-cpn-btn is-remove" onClick={() => onRemove?.()} disabled={!onRemove}>
                      Remove
                    </button>
                  ) : signedIn ? (
                    <button type="button" className="co-cpn-btn" disabled={!canApply} onClick={() => apply(c.code)}>
                      {busy === c.code ? '…' : eligible ? 'Apply' : 'Locked'}
                    </button>
                  ) : (
                    <Link to="/login" state={{ from: { pathname: fromPath } }} className="co-cpn-btn" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Popup>
      )}
    </>
  );
}
