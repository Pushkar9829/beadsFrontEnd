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
    <section id="addresses" className="nx-acct-sec">
      <div className="nx-acct-head">
        <div>
          <p className="nx-eb">Addresses</p>
          <h2 className="nx-d nx-acct-t">Delivery addresses</h2>
          <p className="nx-note">Save a default address for checkout, or fill one from your current location.</p>
        </div>
        {!draft && (
          <Button variant="ghost" size="s" onClick={() => edit(null)}>
            Add address
          </Button>
        )}
      </div>

      {preferred && !draft && (
        <p className="nx-msg mb-4">
          Default address: {preferred.label || 'Home'} · {formatAddress(preferred)}
        </p>
      )}

      {addresses.length > 0 && (
        <div className="nx-addrs">
          {addresses.map((row) => (
            <article key={addressId(row)} className={`nx-addr${row.isDefault ? ' is-default' : ''}`}>
              <p className="nx-k">
                {row.label || 'Home'}
                {addressBadges(row).length ? ` · ${addressBadges(row).join(' · ')}` : ''}
              </p>
              <p className="nx-note">{formatAddress(row)}</p>
              {row.display && <p className="nx-note">{row.display}</p>}
              {row.phone && <p className="nx-note">{row.phone}</p>}
              <div className="nx-addr-acts">
                {!row.isDefault && (
                  <button type="button" className="nx-mini is-c" disabled={busy === addressId(row)} onClick={() => makeDefault(row)}>
                    Set default
                  </button>
                )}
                <button type="button" className="nx-mini" onClick={() => edit(row)}>
                  Edit
                </button>
                <button type="button" className="nx-mini" disabled={busy === addressId(row)} onClick={() => remove(row)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!addresses.length && !draft && <p className="nx-note">No saved addresses yet. Add one or use your current location.</p>}

      {draft && (
        <form onSubmit={saveDraft} className="nx-sum mt-6" noValidate>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="nx-k">{draft._id ? 'Edit address' : 'New address'}</p>
            <Button variant="ghost" size="s" disabled={busy === 'gps'} onClick={useCurrentLocation}>
              <MapPin size={14} strokeWidth={1.6} /> {busy === 'gps' ? 'Locating…' : 'Use current location'}
            </Button>
          </div>
          <div className="nx-fields is-2">
            {FIELDS.map(([key, label, required]) => {
              const invalid = Boolean(fieldErrors[key]);
              const isNumber = key === 'phone' || key === 'pincode';
              return (
                <label key={key} className={`nx-lab${key === 'line1' || key === 'line2' ? ' is-wide' : ''}`}>
                  <span>{label}{required || isNumber ? ' *' : ''}</span>
                  <input
                    className="nx-input"
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
                  />
                  {invalid ? (
                    <span className="nx-bad">{fieldErrors[key]}</span>
                  ) : key === 'phone' ? (
                    <span className="nx-note">10-digit Indian mobile</span>
                  ) : key === 'pincode' ? (
                    <span className="nx-note">6-digit pincode</span>
                  ) : null}
                </label>
              );
            })}
            <label className="nx-check is-wide">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault) || addresses.length === 0}
                onChange={(e) => setDraft((row) => ({ ...row, isDefault: e.target.checked }))}
              />
              Use as default delivery address
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" size="s" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving…' : 'Save address'}
            </Button>
            <Button
              variant="ghost"
              size="s"
              onClick={() => {
                setDraft(null);
                setNote('');
                setFieldErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {note && <p className="nx-msg mt-3">{note}</p>}
    </section>
  );
}
