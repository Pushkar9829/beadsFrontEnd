import { MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import { formatAddress } from '../../lib/addresses';

const FIELDS = [
  { key: 'label', label: 'Address name', type: 'text' },
  { key: 'contactName', label: 'Full name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true, inputMode: 'numeric', maxLength: 10, hint: '10-digit Indian mobile' },
  { key: 'line1', label: 'Address', type: 'text', required: true, wide: true },
  { key: 'line2', label: 'Apartment / landmark', type: 'text', wide: true },
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
      eyebrow="Delivery"
      title="Add new address"
      titleId="address-modal-title"
      label="Close address form"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="s" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="s" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</Button>
        </>
      }
    >
      <div className="nx-fields is-2">
        <div className="is-wide grid gap-2">
          <Button variant="ghost" size="s" className="nx-btn-block" disabled={locating} onClick={onUseLocation}>
            <MapPin size={14} strokeWidth={1.6} /> {locating ? 'Locating…' : 'Use current location'}
          </Button>
          {currentAddress?.line1 && <p className="nx-note">{formatAddress(currentAddress)}</p>}
        </div>
        {FIELDS.map((field) => {
          const invalid = Boolean(fieldErrors[field.key]);
          return (
            <label key={field.key} className={`nx-lab${field.wide ? ' is-wide' : ''}`}>
              <span>{field.label}{field.required ? ' *' : ''}</span>
              <input
                className="nx-input"
                type={field.type}
                inputMode={field.inputMode}
                maxLength={field.maxLength}
                autoComplete={field.key === 'phone' ? 'tel' : field.key === 'pincode' ? 'postal-code' : undefined}
                value={draft[field.key] || ''}
                aria-invalid={invalid}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
              {invalid ? <span className="nx-bad">{fieldErrors[field.key]}</span> : field.hint ? <span className="nx-note">{field.hint}</span> : null}
            </label>
          );
        })}
        <label className="nx-check is-wide">
          <input type="checkbox" checked={makeDefault} onChange={(e) => onMakeDefault(e.target.checked)} />
          Make this my default address
        </label>
        {error && <p className="nx-bad is-wide">{error}</p>}
      </div>
    </Popup>
  );
}
