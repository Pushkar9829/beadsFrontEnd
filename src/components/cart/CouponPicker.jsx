import { useEffect, useState } from 'react';
import { Check, Ticket, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

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
    <div className="bag-coupons">
      <button type="button" className="bag-coupon-toggle" onClick={() => count && setOpen(true)} disabled={!count}>
        <span className="bag-coupon-count">
          <Ticket size={13} />
          {usableLabel}
        </span>
        {count > 0 && <span className="bag-coupon-see">See all</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end p-0 sm:place-items-center sm:p-6">
          <button
            type="button"
            className="studio-modal-scrim absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
            aria-label="Close coupons"
            onClick={() => setOpen(false)}
          />
          <div
            className="studio-modal bag-coupon-modal animate-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-modal-title"
          >
            <div className="studio-modal-bar flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Coupons</p>
                <h2 id="coupon-modal-title" className="mt-1 font-serif text-xl gold-text">
                  All coupons
                </h2>
                <p className="mt-1 text-sm text-lilac">
                  {usableCount} eligible · {count - usableCount} not eligible
                </p>
              </div>
              <button type="button" className="header-icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <ul className="bag-coupon-list is-modal min-h-0 flex-1 overflow-y-auto p-4">
              {coupons.map((c) => {
                const applied = appliedCode && appliedCode.toUpperCase() === c.code;
                const eligible = Boolean(c.usable);
                const canApply = signedIn && eligible && !applied && !busy;
                return (
                  <li key={c.code} className={`bag-coupon-card ${applied ? 'is-on' : ''} ${eligible ? 'is-eligible' : 'is-locked'}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="bag-coupon-code">{c.code}</p>
                        <span className={`bag-coupon-elig ${eligible ? 'is-yes' : 'is-no'}`}>
                          {eligible ? (
                            <>
                              <Check size={11} strokeWidth={2.4} />
                              Eligible
                            </>
                          ) : (
                            'Not eligible'
                          )}
                        </span>
                      </div>
                      <p className="bag-coupon-offer">{c.label}</p>
                      <p className="bag-coupon-meta">
                        {c.minOrder ? `Min ₹${Number(c.minOrder).toLocaleString('en-IN')}` : 'No minimum'}
                        {audienceNote(c.audience) ? ` · ${audienceNote(c.audience)}` : ''}
                        {c.endsAt ? ` · till ${new Date(c.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                      {!eligible && c.reason ? <p className="bag-coupon-reason">{c.reason}</p> : null}
                    </div>
                    {applied ? (
                      <span className="bag-coupon-applied">Applied</span>
                    ) : signedIn ? (
                      <button
                        type="button"
                        className="bag-coupon-apply"
                        disabled={!canApply}
                        onClick={() => apply(c.code)}
                      >
                        {busy === c.code ? '…' : eligible ? 'Apply' : 'Locked'}
                      </button>
                    ) : (
                      <Link to="/login" state={{ from: { pathname: fromPath } }} className="bag-coupon-apply" onClick={() => setOpen(false)}>
                        Sign in
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
