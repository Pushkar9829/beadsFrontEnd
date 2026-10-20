import { useState } from 'react';
import { MapPin } from 'lucide-react';
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

  // Panel, labels and inputs follow the source "Personal Dossier" tab (AuthPage.jsx lines 658-680);
  // address cards follow the source matrix cards (lines 630-646). Styles: styles/atelier/commerce.css "Account".
  return (
    <section id="addresses" className="acct-panel acct-addr-panel">
      <div className="acct-panel-head">
        <h3 className="acct-panel-t">Delivery Addresses</h3>
        {!draft && (
          <button type="button" className="btn-outline acct-btn-o" onClick={() => edit(null)}>
            Add address
          </button>
        )}
      </div>

      {preferred && !draft && (
        <p className="acct-muted">
          Default address: {preferred.label || 'Home'} · {formatAddress(preferred)}
        </p>
      )}

      {addresses.length > 0 && (
        <div className="acct-addrs">
          {addresses.map((row) => (
            <article key={addressId(row)} className={`acct-addr${row.isDefault ? ' is-default' : ''}`}>
              <span className="acct-addr-k">
                {(row.label || 'Home').toUpperCase()}
                {addressBadges(row).length ? ` · ${addressBadges(row).join(' · ').toUpperCase()}` : ''}
              </span>
              <p className="acct-addr-p">{formatAddress(row)}</p>
              {row.display && <p className="acct-addr-p">{row.display}</p>}
              {row.phone && <p className="acct-addr-p">{row.phone}</p>}
              <div className="acct-addr-acts">
                {!row.isDefault && (
                  <button type="button" className="acct-link is-gold" disabled={busy === addressId(row)} onClick={() => makeDefault(row)}>
                    Set default
                  </button>
                )}
                <button type="button" className="acct-link" onClick={() => edit(row)}>
                  Edit
                </button>
                <button type="button" className="acct-link" disabled={busy === addressId(row)} onClick={() => remove(row)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!addresses.length && !draft && <p className="acct-muted">No saved addresses yet. Add one or use your current location.</p>}

      {draft && (
        <form onSubmit={saveDraft} className="acct-addr-form" noValidate>
          <div className="acct-panel-head">
            <span className="acct-addr-k">{draft._id ? 'EDIT ADDRESS' : 'NEW ADDRESS'}</span>
            <button type="button" className="btn-outline acct-btn-o" disabled={busy === 'gps'} onClick={useCurrentLocation}>
              <MapPin size={14} strokeWidth={1.6} /> {busy === 'gps' ? 'Locating…' : 'Use current location'}
            </button>
          </div>
          <div className="acct-fields">
            {FIELDS.map(([key, label, required]) => {
              const invalid = Boolean(fieldErrors[key]);
              const isNumber = key === 'phone' || key === 'pincode';
              return (
                <div key={key} className={key === 'line1' || key === 'line2' ? 'is-wide' : ''}>
                  <label className="acct-label" htmlFor={`ab-${key}`}>
                    {label}
                    {required || isNumber ? ' *' : ''}
                  </label>
                  <input
                    id={`ab-${key}`}
                    className="acct-input"
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
                    <span className="acct-bad">{fieldErrors[key]}</span>
                  ) : key === 'phone' ? (
                    <span className="acct-hint">10-digit Indian mobile</span>
                  ) : key === 'pincode' ? (
                    <span className="acct-hint">6-digit pincode</span>
                  ) : null}
                </div>
              );
            })}
            <label className="acct-check is-wide">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault) || addresses.length === 0}
                onChange={(e) => setDraft((row) => ({ ...row, isDefault: e.target.checked }))}
              />
              Use as default delivery address
            </label>
          </div>
          <div className="acct-form-acts">
            <button type="submit" className="btn-gold acct-btn" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving…' : 'Save address'}
            </button>
            <button
              type="button"
              className="btn-outline acct-btn-o"
              onClick={() => {
                setDraft(null);
                setNote('');
                setFieldErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {note && <p className="acct-muted">{note}</p>}
    </section>
  );
}
