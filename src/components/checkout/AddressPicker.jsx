// "Delivery to" block of the checkout side panel. Source: beeds_ecommerce/src/pages/CheckoutPage.jsx lines 252-330
// (selector box, address details, "Add new address"). The selector is a <select> styled as the source box so
// saved addresses can be switched. Styles: styles/atelier/commerce.css "Checkout".
import { addressId, formatAddress, formatAddressOption, formatContact } from '../../lib/addresses';

export default function AddressPicker({
  addresses,
  selectedId,
  selected,
  phone,
  onSelect,
  onAddNew,
  missing = false,
}) {
  const hasSaved = addresses.length > 0;

  return (
    <div className={`co-deliver${missing ? ' is-missing' : ''}`}>
      <span className="co-label">Delivery to</span>
      {hasSaved && (
        <select
          className="co-addr-box"
          aria-label="Saved addresses"
          aria-invalid={missing}
          title="Click to change or add address"
          value={selectedId}
          onChange={(e) => {
            const row = addresses.find((item) => addressId(item) === e.target.value);
            if (row) onSelect(row);
          }}
        >
          {addresses.map((row) => {
            const id = addressId(row);
            return (
              <option key={id} value={id}>
                {formatAddressOption(row)}
              </option>
            );
          })}
        </select>
      )}

      {selected ? (
        <div className="co-addr">
          <div className="co-addr-label">{(selected.label || 'Home').toUpperCase()}</div>
          <div className="co-addr-line">{formatAddress(selected)}</div>
          {(phone || selected.phone) && <div className="co-addr-phone">Contact:{formatContact(phone || selected.phone)}</div>}
        </div>
      ) : (
        <p className={missing ? 'co-bad' : 'co-note'}>Add a delivery address to continue.</p>
      )}

      <button type="button" className="co-btn-line" onClick={onAddNew}>
        Add new address
      </button>
    </div>
  );
}
