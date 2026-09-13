import { MapPin } from 'lucide-react';
import Button from '../ui/Button';
import { addressId, formatAddress } from '../../lib/addresses';

export default function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  onUseLocation,
  locating,
  saveAddress,
  onSaveAddress,
  makeDefault,
  onMakeDefault,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-gold">Delivery address</p>
        <Button type="button" variant="ghost" disabled={locating} onClick={onUseLocation}>
          <MapPin size={14} /> {locating ? 'Locating…' : 'Use current location'}
        </Button>
      </div>
      {addresses.length > 0 && (
        <div className="grid gap-2">
          {addresses.map((row) => {
            const id = addressId(row);
            return (
              <label
                key={id}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                  selectedId === id ? 'border-gold bg-gold/10 text-ivory' : 'border-gold/20 text-lilac'
                }`}
              >
                <input type="radio" name="saved-address" checked={selectedId === id} onChange={() => onSelect(row)} />
                <span>
                  <span className="block text-[10px] uppercase tracking-widest text-gold">
                    {row.label || 'Home'}{row.isDefault ? ' · Default' : ''}
                  </span>
                  <span className="mt-1 block">{formatAddress(row)}</span>
                </span>
              </label>
            );
          })}
          <label
            className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-sm ${
              selectedId === 'new' ? 'border-gold bg-gold/10 text-ivory' : 'border-gold/20 text-lilac'
            }`}
          >
            <input type="radio" name="saved-address" checked={selectedId === 'new'} onChange={() => onSelect(null)} />
            New / current location
          </label>
        </div>
      )}
      <div className="flex flex-col gap-2 text-sm text-lilac">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={saveAddress} onChange={(e) => onSaveAddress(e.target.checked)} />
          Save this address to my account
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={makeDefault} onChange={(e) => onMakeDefault(e.target.checked)} />
          Make this my default address
        </label>
      </div>
    </div>
  );
}
