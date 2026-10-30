// Free Kundli helpers shared by the home modal (AtelierHome), Account → My Kundli and the admin page.

export const EMPTY_BIRTH = { name: '', gender: '', dob: '', tob: '', tobUnknown: false, place: null };

/** Stored birth (API) -> form state; `place` holds the chosen autocomplete option. */
export function birthToForm(birth, fallbackName = '') {
  if (!birth) return { ...EMPTY_BIRTH, name: fallbackName };
  return {
    name: birth.name || fallbackName,
    gender: birth.gender || '',
    dob: birth.dob || '',
    tob: birth.tobUnknown ? '' : birth.tob || '',
    tobUnknown: Boolean(birth.tobUnknown),
    place: birth.place ? { label: birth.place, lat: birth.lat, lon: birth.lon, timezoneId: birth.timezoneId } : null,
  };
}

/** Client-side check before submitting; the API validates again. Returns an error message or ''. */
export function birthFormError(form) {
  if (!String(form.name || '').trim()) return 'Please enter the full name.';
  if (!['male', 'female'].includes(form.gender)) return 'Please choose a gender.';
  if (!form.dob) return 'Please enter the date of birth.';
  if (!form.tobUnknown && !form.tob) return 'Please enter the time of birth, or tick "I don\'t know my birth time".';
  if (!form.place) return 'Please choose the place of birth from the suggestions.';
  return '';
}

export function birthPayload(form, extra = {}) {
  return {
    ...extra,
    name: String(form.name || '').trim(),
    gender: form.gender,
    dob: form.dob,
    tob: form.tobUnknown ? '' : form.tob,
    tobUnknown: Boolean(form.tobUnknown),
    place: form.place?.label || '',
    lat: form.place?.lat,
    lon: form.place?.lon,
    timezoneId: form.place?.timezoneId,
  };
}

/** Kundli PDF links are only rendered when they are https (defence in depth; the API checks too). */
export function safePdfUrl(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return '';
  try {
    return new URL(url).protocol === 'https:' ? url : '';
  } catch {
    return '';
  }
}

/** Statuses after which the customer has a Kundli in progress or done (not "waiting to start"). */
export const KUNDLI_STARTED = ['queued', 'generating', 'ready', 'failed'];

/** Third-party SVG -> data URL for an <img> (never injected into the DOM). */
export function svgDataUrl(svg) {
  if (!svg || typeof svg !== 'string') return '';
  try {
    const bytes = new TextEncoder().encode(svg);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return `data:image/svg+xml;base64,${btoa(bin)}`;
  } catch {
    return '';
  }
}

/** astro_details keys are misspelled upstream (Naksahtra); read both spellings. */
export function astroSummary(astro) {
  const a = astro && typeof astro === 'object' ? astro : {};
  const pick = (...keys) => keys.map((k) => a[k]).find((v) => v !== undefined && v !== null && v !== '') ?? '';
  return [
    ['Ascendant', pick('ascendant', 'Ascendant')],
    ['Moon sign', pick('sign', 'moon_sign', 'Sign')],
    ['Nakshatra', pick('Naksahtra', 'Nakshatra', 'nakshatra')],
    ['Nakshatra lord', pick('NaksahtraLord', 'NakshatraLord', 'nakshatra_lord')],
    ['Gan', pick('Gan', 'gan')],
    ['Nadi', pick('Nadi', 'nadi')],
    ['Varna', pick('Varna', 'varna')],
  ].filter(([, v]) => v !== '');
}

export function planetRows(planets) {
  return (Array.isArray(planets) ? planets : []).map((p) => ({
    name: p?.name || '',
    sign: p?.sign || '',
    house: p?.house ?? '',
    degree: Number.isFinite(Number(p?.normDegree)) ? Number(p.normDegree) : Number.isFinite(Number(p?.fullDegree)) ? Number(p.fullDegree) % 30 : null,
    retro: String(p?.isRetro).toLowerCase() === 'true',
  }));
}

/** 15.42 -> 15°25′ */
export function formatDegree(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const v = Number(value);
  const d = Math.floor(v);
  const m = Math.round((v - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`;
}

/** current_vdasha dates arrive as 'D-M-YYYY H:mm'; show 'D Mon YYYY'. */
export function dashaDate(value) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(String(value || ''));
  if (!m) return String(value || '—');
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const GEM_SLOTS = [
  { key: 'LIFE', label: 'Life stone' },
  { key: 'BENEFIC', label: 'Benefic stone' },
  { key: 'LUCKY', label: 'Lucky stone' },
];

export const KUNDLI_SECTION_LABELS = {
  astro: 'Birth summary',
  planets: 'Planets',
  chartSvg: 'D1 chart',
  dasha: 'Current dasha',
  manglik: 'Manglik',
  gems: 'Gemstones',
  rudraksha: 'Rudraksha',
  pdf: 'PDF',
};
