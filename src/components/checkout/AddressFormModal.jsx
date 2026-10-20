// Add-address popup of the checkout. Source: beeds_ecommerce/src/pages/CheckoutPage.jsx lines 660-784
// ("DELIVERY ADDRESS" modal: uppercase labels, dark inputs, gold "Save & Deliver Here"). The frontend keeps its
// extra fields (name, line 2, state, country, location, default flag). Styles: styles/atelier/commerce.css "Checkout".
import { MapPin } from 'lucide-react';
import Popup from '../ui/Popup';
import { formatAddress } from '../../lib/addresses';

const FIELDS = [
  { key: 'label', label: 'Address Label (e.g. Home, Office)', type: 'text', wide: true },
  { key: 'contactName', label: 'Full name', type: 'text', required: true, wide: true },
  { key: 'line1', label: 'Street Address', type: 'text', required: true, wide: true, placeholder: 'e.g. 12 Test Lane, Civil Lines' },
  { key: 'line2', label: 'Apartment / landmark', type: 'text', wide: true },
  { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'Jaipur' },
  { key: 'pincode', label: 'Pincode', type: 'tel', required: true, inputMode: 'numeric', maxLength: 6, placeholder: '302001' },
  { key: 'state', label: 'State', type: 'text', required: true },
  { key: 'country', label: 'Country', type: 'text', required: true },
  { key: 'phone', label: 'Contact Phone', type: 'tel', required: true, inputMode: 'numeric', maxLength: 10, wide: true, hint: '10-digit Indian mobile' },
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
  return (
    <Popup
      as="form"
      formProps={{
        noValidate: true,
        onSubmit: (e) => {
          e.preventDefault();
          onSave();
        },
      }}
      title="DELIVERY ADDRESS"
      titleId="address-modal-title"
      label="Close address form"
      onClose={onClose}
    >
      <div className="co-mform">
        <button type="button" className="co-btn-line co-locate" disabled={locating} onClick={onUseLocation}>
          <MapPin size={14} strokeWidth={1.6} /> {locating ? 'Locating…' : 'Use current location'}
        </button>
        {currentAddress?.line1 && <p className="co-note">{formatAddress(currentAddress)}</p>}
        <div className="co-mgrid">
          {FIELDS.map((field) => {
            const invalid = Boolean(fieldErrors[field.key]);
            return (
              <div key={field.key} className={field.wide ? 'is-wide' : ''}>
                <label className="co-mlabel" htmlFor={`addr-${field.key}`}>
                  {field.label}
                </label>
                <input
                  id={`addr-${field.key}`}
                  className="co-minput"
                  type={field.type}
                  inputMode={field.inputMode}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  autoComplete={field.key === 'phone' ? 'tel' : field.key === 'pincode' ? 'postal-code' : undefined}
                  value={draft[field.key] || ''}
                  aria-invalid={invalid}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
                {invalid ? <span className="co-bad">{fieldErrors[field.key]}</span> : null}
              </div>
            );
          })}
        </div>
        <label className="co-check">
          <input type="checkbox" checked={makeDefault} onChange={(e) => onMakeDefault(e.target.checked)} />
          Make this my default address
        </label>
        {error && <p className="co-bad">{error}</p>}
        <button type="submit" className="co-modal-submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save & Deliver Here'}
        </button>
      </div>
    </Popup>
  );
}
