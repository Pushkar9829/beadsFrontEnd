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
    source: 'manual',
    ...extra,
  };
}

export function defaultAddress(user) {
  return user?.addresses?.find((row) => row.isDefault) || user?.addresses?.[0] || null;
}

export function formatAddress(row) {
  if (!row) return '';
  return [row.line1, row.line2, row.city, row.state, row.pincode].filter(Boolean).join(', ');
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
