import { useState } from 'react';
import { MapPin } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { detectCurrentAddress } from '../../lib/location';
import {
  addressBadges,
  addressId,
  defaultAddress,
  digitsOnly,
  emptyAddress,
  formatAddress,
  normalizePhone,
  removeAddress,
  setDefaultAddress,
  upsertAddress,
  validateAddress,
} from '../../lib/addresses';

const FIELDS = [
  ['label', 'Label', false],
  ['phone', 'Phone', true],
  ['line1', 'Address', true],
  ['line2', 'Apartment / landmark', false],
  ['city', 'City', true],
  ['state', 'State', true],
  ['pincode', 'Pincode', true],
  ['country', 'Country', true],
];

export default function AddressBook() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const addresses = user?.addresses || [];
  const [draft, setDraft] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  function edit(row) {
    setNote('');
    setFieldErrors({});
    setDraft(row ? {
      ...emptyAddress(),
      ...row,
      _id: row._id,
      phone: digitsOnly(row.phone || user?.phone || '', 10),
      pincode: digitsOnly(row.pincode, 6),
    } : emptyAddress({
      isDefault: addresses.length === 0,
      phone: digitsOnly(user?.phone || '', 10),
    }));
  }

  async function saveList(next, message) {
    const saved = await updateProfile({ addresses: next });
    setDraft(null);
    setFieldErrors({});
    setNote(message || 'Address saved.');
    return saved;
  }

  async function saveDraft(e) {
    e.preventDefault();
    const nextDraft = {
      ...draft,
      phone: normalizePhone(draft.phone),
      pincode: digitsOnly(draft.pincode, 6),
    };
    const errors = validateAddress(nextDraft);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setNote('Fix the marked fields to save this address.');
      return;
    }
    setBusy('save');
    setNote('');
    setFieldErrors({});
    try {
      await saveList(upsertAddress(addresses, nextDraft), draft._id ? 'Address updated.' : 'Address added.');
    } catch (err) {
      setNote(err.message || 'Could not save address.');
    } finally {
      setBusy('');
    }
  }

  async function useCurrentLocation() {
    setBusy('gps');
    setNote('');
    try {
      const found = await detectCurrentAddress();
      setDraft((current) => ({
        ...(current || emptyAddress({ phone: user?.phone || '', isDefault: addresses.length === 0 })),
        ...found,
        phone: current?.phone || user?.phone || '',
        isDefault: current?.isDefault || addresses.length === 0,
      }));
      setNote(found.needsPincode
        ? 'Location found. Add your 6-digit pincode to save this address.'
        : 'Current location filled. Review and save.');
    } catch (err) {
      setNote(err.message || 'Could not read your location.');
    } finally {
      setBusy('');
    }
  }

  async function makeDefault(row) {
    setBusy(addressId(row));
    setNote('');
    try {
      await saveList(setDefaultAddress(addresses, addressId(row)), 'Default address updated.');
    } catch (err) {
      setNote(err.message || 'Could not update default address.');
    } finally {
      setBusy('');
    }
  }

  async function remove(row) {
    setBusy(addressId(row));
    setNote('');
    try {
      await saveList(removeAddress(addresses, addressId(row)), 'Address removed.');
    } catch (err) {
      setNote(err.message || 'Could not remove address.');
    } finally {
      setBusy('');
    }
  }

  const preferred = defaultAddress(user);

  return (
    <section id="addresses" className="mt-12 sm:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Addresses</p>
          <h2 className="mt-2 font-serif text-2xl gold-text">Delivery addresses</h2>
          <p className="mt-2 max-w-xl text-sm text-lilac">
            Save a default address for checkout, or fill one from your current location.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={() => edit(null)}>Add address</Button>
      </div>

      {preferred && !draft && (
        <p className="mt-4 text-xs text-gold">
          Default address: {preferred.label || 'Home'} · {formatAddress(preferred)}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {addresses.map((row) => (
          <article key={addressId(row)} className={`rounded-2xl border p-4 ${row.isDefault ? 'border-gold/50 bg-gold/5' : 'border-gold/20 bg-surface/70'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {row.label || 'Home'}{addressBadges(row).length ? ` · ${addressBadges(row).join(' · ')}` : ''}
                </p>
                <p className="mt-2 text-sm text-lilac">{formatAddress(row)}</p>
                {row.display && <p className="mt-1 text-xs text-lilac/80">{row.display}</p>}
                {row.phone && <p className="mt-1 text-xs text-lilac">{row.phone}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {!row.isDefault && (
                  <Button type="button" variant="ghost" disabled={busy === addressId(row)} onClick={() => makeDefault(row)}>
                    Set default
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={() => edit(row)}>Edit</Button>
                <Button type="button" variant="ghost" disabled={busy === addressId(row)} onClick={() => remove(row)}>
                  Remove
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!addresses.length && !draft && (
          <p className="text-sm text-lilac">No saved addresses yet. Add one or use your current location.</p>
        )}
      </div>

      {draft && (
        <form onSubmit={saveDraft} className="auth-card mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{draft._id ? 'Edit address' : 'New address'}</p>
            <Button type="button" variant="ghost" disabled={busy === 'gps'} onClick={useCurrentLocation}>
              <MapPin size={14} /> {busy === 'gps' ? 'Locating…' : 'Use current location'}
            </Button>
          </div>
          {FIELDS.map(([key, label, required]) => {
            const invalid = Boolean(fieldErrors[key]);
            const isNumber = key === 'phone' || key === 'pincode';
            return (
              <label key={key} className="block text-xs uppercase tracking-widest text-gold">
                {label}{required || isNumber ? ' *' : ''}
                <input
                  type={isNumber ? 'tel' : 'text'}
                  inputMode={isNumber ? 'numeric' : undefined}
                  maxLength={key === 'phone' ? 10 : key === 'pincode' ? 6 : undefined}
                  value={draft[key] || ''}
                  aria-invalid={invalid}
                  onChange={(e) => {
                    const value = isNumber ? digitsOnly(e.target.value, key === 'phone' ? 10 : 6) : e.target.value;
                    setDraft((row) => ({ ...row, [key]: value }));
                    setFieldErrors((current) => {
                      if (!current[key]) return current;
                      const next = { ...current };
                      delete next[key];
                      return next;
                    });
                  }}
                  className={`mt-1 w-full rounded-xl border bg-ink px-3 py-2 text-ivory ${
                    invalid ? 'border-red-400' : 'border-gold/30'
                  }`}
                />
                {invalid ? (
                  <span className="mt-1 block text-[11px] normal-case tracking-normal text-red-300">{fieldErrors[key]}</span>
                ) : key === 'phone' ? (
                  <span className="mt-1 block text-[11px] normal-case tracking-normal text-lilac">10-digit Indian mobile</span>
                ) : key === 'pincode' ? (
                  <span className="mt-1 block text-[11px] normal-case tracking-normal text-lilac">6-digit pincode</span>
                ) : null}
              </label>
            );
          })}
          <label className="flex items-center gap-2 text-sm text-lilac">
            <input
              type="checkbox"
              checked={Boolean(draft.isDefault) || addresses.length === 0}
              onChange={(e) => setDraft((row) => ({ ...row, isDefault: e.target.checked }))}
            />
            Use as default delivery address
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy === 'save'}>{busy === 'save' ? 'Saving…' : 'Save address'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setDraft(null); setNote(''); setFieldErrors({}); }}>Cancel</Button>
          </div>
        </form>
      )}
      {note && <p className="mt-3 text-sm text-gold">{note}</p>}
    </section>
  );
}
