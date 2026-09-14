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
    <div className={`space-y-3 ${missing ? 'rounded-xl border border-red-400/70 p-3' : ''}`}>
      <p className="text-xs uppercase tracking-widest text-gold">Delivery to</p>
      <select
        className={`w-full truncate rounded-xl border bg-ink px-3 py-2.5 text-sm text-ivory ${
          missing ? 'border-red-400' : 'border-gold/30'
        }`}
        value={hasSaved ? selectedId : ''}
        disabled={!hasSaved}
        onChange={(e) => {
          const row = addresses.find((item) => addressId(item) === e.target.value);
          if (row) onSelect(row);
        }}
      >
        {!hasSaved && <option value="">Select address</option>}
        {addresses.map((row) => {
          const id = addressId(row);
          return (
            <option key={id} value={id}>
              {formatAddressOption(row)}
            </option>
          );
        })}
      </select>

      {selected ? (
        <div className="px-0.5 text-sm text-lilac">
          <p className="font-medium uppercase tracking-wide text-ivory">{selected.label || 'Home'}</p>
          <p className="mt-1 leading-relaxed">{formatAddress(selected)}</p>
          {(phone || selected.phone) && (
            <p className="mt-2 text-[11px] uppercase tracking-widest text-lilac">
              Contact: {formatContact(phone || selected.phone)}
            </p>
          )}
        </div>
      ) : (
        <p className={`text-sm ${missing ? 'text-red-300' : 'text-lilac'}`}>
          Add a delivery address to continue.
        </p>
      )}

      <button
        type="button"
        className="w-full rounded-xl border border-gold/40 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ivory hover:border-gold hover:bg-gold/10"
        onClick={onAddNew}
      >
        Add new address
      </button>
    </div>
  );
}
