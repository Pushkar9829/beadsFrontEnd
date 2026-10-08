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
    <div className={`grid gap-3${missing ? ' nx-addr-pick is-missing' : ''}`}>
      <p className="nx-k">Delivery to</p>
      {hasSaved && (
        <select
          className="nx-input"
          aria-label="Saved addresses"
          aria-invalid={missing}
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
        <div className="nx-addr-now">
          <b>{selected.label || 'Home'}</b>
          {formatAddress(selected)}
          {(phone || selected.phone) && <span className="mt-1 block text-[13px]">Contact: {formatContact(phone || selected.phone)}</span>}
        </div>
      ) : (
        <p className={missing ? 'nx-bad' : 'nx-note'}>Add a delivery address to continue.</p>
      )}

      <button type="button" className="nx-btn nx-btn-o nx-btn-s nx-btn-block" onClick={onAddNew}>
        Add new address
      </button>
    </div>
  );
}
