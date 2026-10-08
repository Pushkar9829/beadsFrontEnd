import { useEffect, useState } from 'react';
import { Check, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Popup from '../ui/Popup';

function audienceNote(audience) {
  if (audience === 'new') return 'First order';
  if (audience === 'existing') return 'Returning customers';
  return '';
}

export default function CouponPicker({ appliedCode, onQuote, signedIn, refreshKey, fromPath = '/cart' }) {
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
        onQuote?.(data.quote, 'Applied.');
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

  return (
    <>
      <button type="button" className="nx-coupons-toggle" onClick={() => count && setOpen(true)} disabled={!count}>
        <span>
          <Ticket size={14} strokeWidth={1.6} />
          {usableLabel}
        </span>
        {count > 0 && <span>See all</span>}
      </button>

      {open && (
        <Popup eyebrow="Coupons" title="All coupons" titleId="coupon-modal-title" label="Close coupons" onClose={() => setOpen(false)}>
          <p className="nx-note mb-4">
            {usableCount} eligible · {count - usableCount} not eligible
          </p>
          <ul className="nx-coupon-list">
            {coupons.map((c) => {
              const applied = appliedCode && appliedCode.toUpperCase() === c.code;
              const eligible = Boolean(c.usable);
              const canApply = signedIn && eligible && !applied && !busy;
              return (
                <li key={c.code} className={`nx-coupon${applied ? ' is-on' : ''}${eligible ? ' is-ok' : ' is-locked'}`}>
                  <div className="min-w-0">
                    <p>
                      <span className="nx-coupon-code">{c.code}</span>
                      <span className="nx-coupon-tag">
                        {eligible ? (
                          <>
                            <Check size={11} strokeWidth={2.4} />
                            Eligible
                          </>
                        ) : (
                          'Not eligible'
                        )}
                      </span>
                    </p>
                    <p className="nx-coupon-offer">{c.label}</p>
                    <p className="nx-note">
                      {c.minOrder ? `Min ₹${Number(c.minOrder).toLocaleString('en-IN')}` : 'No minimum'}
                      {audienceNote(c.audience) ? ` · ${audienceNote(c.audience)}` : ''}
                      {c.endsAt ? ` · till ${new Date(c.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                    </p>
                    {!eligible && c.reason ? <p className="nx-note">{c.reason}</p> : null}
                  </div>
                  {applied ? (
                    <span className="nx-mini is-c">Applied</span>
                  ) : signedIn ? (
                    <button type="button" className="nx-mini is-c" disabled={!canApply} onClick={() => apply(c.code)}>
                      {busy === c.code ? '…' : eligible ? 'Apply' : 'Locked'}
                    </button>
                  ) : (
                    <Link to="/login" state={{ from: { pathname: fromPath } }} className="nx-mini is-c" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Popup>
      )}
    </>
  );
}
