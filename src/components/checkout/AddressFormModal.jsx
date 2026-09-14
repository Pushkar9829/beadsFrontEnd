import { useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import Button from '../ui/Button';
import { formatAddress } from '../../lib/addresses';

const FIELDS = [
  { key: 'label', label: 'Address name', type: 'text' },
  { key: 'contactName', label: 'Full name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true, inputMode: 'numeric', maxLength: 10, hint: '10-digit Indian mobile' },
  { key: 'line1', label: 'Address', type: 'text', required: true },
  { key: 'line2', label: 'Apartment / landmark', type: 'text' },
  { key: 'city', label: 'City', type: 'text', required: true },
  { key: 'state', label: 'State', type: 'text', required: true },
  { key: 'pincode', label: 'Pincode', type: 'tel', required: true, inputMode: 'numeric', maxLength: 6, hint: '6-digit pincode' },
  { key: 'country', label: 'Country', type: 'text', required: true },
];

export default function AddressFormModal({
  draft,
  onChange,
  onClose,
  onSave,
  onUseLocation,
  locating,
  currentAddress,
  makeDefault,
  onMakeDefault,
  saving,
  error,
  fieldErrors = {},
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-0 sm:place-items-center sm:p-6">
      <button
        type="button"
        className="studio-modal-scrim absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        aria-label="Close address form"
        onClick={onClose}
      />
      <form
        className="studio-modal bag-coupon-modal animate-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="studio-modal-bar flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Delivery</p>
            <h2 id="address-modal-title" className="mt-1 font-serif text-xl gold-text">
              Add new address
            </h2>
          </div>
          <button type="button" className="header-icon" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          <Button type="button" variant="ghost" className="w-full" disabled={locating} onClick={onUseLocation}>
            <MapPin size={14} /> {locating ? 'Locating…' : 'Use current location'}
          </Button>
          {currentAddress?.line1 && (
            <p className="text-xs text-lilac">{formatAddress(currentAddress)}</p>
          )}
          {FIELDS.map((field) => {
            const invalid = Boolean(fieldErrors[field.key]);
            return (
              <label key={field.key} className="block text-xs uppercase tracking-widest text-gold">
                {field.label}{field.required ? ' *' : ''}
                <input
                  type={field.type}
                  inputMode={field.inputMode}
                  maxLength={field.maxLength}
                  autoComplete={field.key === 'phone' ? 'tel' : field.key === 'pincode' ? 'postal-code' : undefined}
                  value={draft[field.key] || ''}
                  aria-invalid={invalid}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-ink px-3 py-2 text-ivory ${
                    invalid ? 'border-red-400' : 'border-gold/30'
                  }`}
                />
                {invalid ? (
                  <span className="mt-1 block text-[11px] normal-case tracking-normal text-red-300">
                    {fieldErrors[field.key]}
                  </span>
                ) : field.hint ? (
                  <span className="mt-1 block text-[11px] normal-case tracking-normal text-lilac">
                    {field.hint}
                  </span>
                ) : null}
              </label>
            );
          })}
          <label className="flex items-center gap-2 text-sm text-lilac">
            <input type="checkbox" checked={makeDefault} onChange={(e) => onMakeDefault(e.target.checked)} />
            Make this my default address
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-2 border-t border-[rgba(198,167,94,0.2)] px-5 py-4">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</Button>
        </div>
      </form>
    </div>
  );
}
