export function emptyAddress(extra = {}) {
  return {
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    isDefault: false,
    display: '',
    source: 'manual',
    ...extra,
  };
}

export function defaultAddress(user) {
  return user?.addresses?.find((row) => row.isDefault) || user?.addresses?.[0] || null;
}

export function formatAddress(row) {
  if (!row) return '';
  return [row.line1, row.line2, row.city, row.state, row.pincode, row.country].filter(Boolean).join(', ');
}

export function formatAddressOption(row) {
  if (!row) return 'Select address';
  const label = row.label || 'Home';
  const full = [row.line1, row.line2, row.city, row.state, row.pincode].filter(Boolean).join(', ');
  return full ? `${label} – ${full}` : label;
}

export function formatContact(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.startsWith('91') && digits.length > 12) return `+${digits}`;
  return String(phone);
}

export function addressBadges(row) {
  const badges = [];
  if (row?.isDefault) badges.push('Default');
  if (row?.source === 'gps') badges.push('Current location');
  return badges;
}

export function addressId(row) {
  return row?._id ? String(row._id) : '';
}

export function upsertAddress(list, draft) {
  const incoming = { ...emptyAddress(), ...draft };
  const next = (list || []).map((row) => ({
    ...row,
    isDefault: incoming.isDefault ? false : row.isDefault,
  }));
  const id = addressId(incoming);
  if (id) {
    return next.map((row) => (addressId(row) === id ? { ...row, ...incoming } : row));
  }
  return [...next, { ...incoming, isDefault: incoming.isDefault || next.length === 0 }];
}

export function setDefaultAddress(list, id) {
  return (list || []).map((row) => ({ ...row, isDefault: addressId(row) === String(id) }));
}

export function removeAddress(list, id) {
  const next = (list || []).filter((row) => addressId(row) !== String(id));
  if (next.length && !next.some((row) => row.isDefault)) next[0].isDefault = true;
  return next;
}

export function digitsOnly(value, max) {
  return String(value || '').replace(/\D/g, '').slice(0, max);
}

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

export function isValidPincode(pincode) {
  return /^\d{6}$/.test(String(pincode || '').replace(/\D/g, ''));
}

export function phoneError(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return 'Enter a 10-digit mobile number.';
  if (digits.length !== 10) return 'Mobile number must be 10 digits.';
  if (!/^[6-9]/.test(digits)) return 'Enter a valid Indian mobile number.';
  return '';
}

export function pincodeError(pincode) {
  const digits = String(pincode || '').replace(/\D/g, '');
  if (!digits) return 'Enter a 6-digit pincode.';
  if (digits.length !== 6) return 'Pincode must be 6 digits.';
  return '';
}

export function validateAddress(row = {}, { requireName = false } = {}) {
  const errors = {};
  if (requireName && !String(row.contactName || '').trim()) errors.contactName = 'Enter the full name.';
  const phoneMsg = phoneError(row.phone);
  if (phoneMsg) errors.phone = phoneMsg;
  if (!String(row.line1 || '').trim()) errors.line1 = 'Enter the street address.';
  if (!String(row.city || '').trim()) errors.city = 'Enter the city.';
  if (!String(row.state || '').trim()) errors.state = 'Enter the state.';
  const pinMsg = pincodeError(row.pincode);
  if (pinMsg) errors.pincode = pinMsg;
  return errors;
}

export function addressReady(row, extra = {}) {
  return Object.keys(validateAddress(row, extra)).length === 0;
}

export function checkoutFromAddress(address, user) {
  return {
    contactName: user?.name || '',
    phone: address?.phone || user?.phone || '',
    line1: address?.line1 || '',
    line2: address?.line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    country: address?.country || 'India',
  };
}
