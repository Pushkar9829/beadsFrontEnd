const REV_KEY = 'ks-storefront-rev';

export function publishStorefront() {
  try {
    localStorage.setItem(REV_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isStorefrontRevEvent(event) {
  return event?.key === REV_KEY;
}
