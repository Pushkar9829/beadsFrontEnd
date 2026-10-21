// Tiny field-schema language used by the Site pages editor. A section lists fields; each field
// points at a path inside the section's slice of the SiteContent document.
//   text('title', 'Title')                  single-line input
//   area('body', 'Body', { rows })          textarea
//   media('image', 'Image', { folder })     MediaInput
//   cta('primaryCta', 'Primary button')     { label, to }
//   list('items', 'Houses', fields, opts)   rows with add / remove / reorder
//   strings('intro', 'Intro paragraphs')    string[] with add / remove / reorder
//   links('shopLinks', 'Shop links')        [{ label, to }]
//   group('Title', fields, key?)            visual group (nested under key when given)
//   row(fields)                             fields side by side on wide screens
//   note('text', { to, linkLabel })         help text, optionally with an admin link
//   toggle('showSummary', 'Label')          on/off switch (boolean)
//   number('limit', 'Label', { min, max })  number input
//   custom('hotspot', 'Label', Component)   custom control: <Component value onChange parent field />

export const text = (k, label, opts = {}) => ({ type: 'text', k, label, ...opts });
export const area = (k, label, opts = {}) => ({ type: 'textarea', k, label, rows: 3, ...opts });
export const media = (k, label, opts = {}) => ({ type: 'media', k, label, folder: 'other', ...opts });
export const color = (k, label) => ({ type: 'color', k, label });
export const icon = (k, label = 'Icon') => ({ type: 'icon', k, label });
export const select = (k, label, options) => ({ type: 'select', k, label, options });
export const cta = (k, label) => ({ type: 'cta', k, label });
export const list = (k, label, fields, opts = {}) => ({ type: 'list', k, label, fields, ...opts });
export const strings = (k, label, opts = {}) => ({ type: 'strings', k, label, ...opts });
export const links = (k, label) =>
  list(k, label, [row([text('label', 'Label'), text('to', 'Link', { placeholder: '/path' })])], {
    itemLabel: 'Link',
    newItem: { label: '', to: '' },
    compact: true,
    summary: (item) => item.label || item.to,
  });
export const group = (title, fields, k = '') => ({ type: 'group', title, fields, k });
export const row = (fields) => ({ type: 'row', fields });
export const note = (textValue, opts = {}) => ({ type: 'note', text: textValue, ...opts });
export const toggle = (k, label, opts = {}) => ({ type: 'switch', k, label, ...opts });
export const number = (k, label, opts = {}) => ({ type: 'number', k, label, ...opts });
export const custom = (k, label, component, opts = {}) => ({ type: 'custom', k, label, component, ...opts });

/** Home / link pair used by most copy blocks. */
export const linkPair = (labelKey = 'action', toKey = 'to', prefix = '') =>
  row([text(labelKey, `${prefix}Link label`), text(toKey, `${prefix}Link`, { placeholder: '/path' })]);

/**
 * The "empty / missing state" block used on many storefront pages. Only the parts the page
 * actually shows are offered: `kicker` (eyebrow), `copy` (text under the title) and `secondary`
 * (a second button) can be switched off per page.
 */
export const emptyState = (k = 'empty', title = 'Empty state', { kicker = true, copy = true, secondary = true, titleLabel = 'Title', hint } = {}) =>
  group(
    title,
    [
      ...(hint ? [note(hint)] : []),
      kicker ? row([text('kicker', 'Kicker'), text('title', titleLabel)]) : text('title', titleLabel),
      ...(copy ? [area('copy', 'Copy', { rows: 2 })] : []),
      cta('primaryCta', secondary ? 'Primary button' : 'Button'),
      ...(secondary ? [cta('secondaryCta', 'Secondary button')] : []),
    ],
    k
  );

/** Empty state of a listing (shop, house, category, collections): one line and one pill button, as in the design. */
export const listingEmpty = (k = 'empty', title = 'Empty state') =>
  emptyState(k, title, { kicker: false, copy: false, secondary: false, titleLabel: 'Line', hint: 'Shown inside the pieces area: one line and a pill button.' });

export function joinPath(...parts) {
  return parts.filter((p) => p !== '' && p !== undefined && p !== null).join('.');
}

/** Lower-case words of every label in a schema, for the section search. */
export function schemaLabels(fields = []) {
  const out = [];
  for (const f of fields) {
    if (f.label) out.push(f.label);
    if (f.title) out.push(f.title);
    if (f.fields) out.push(...schemaLabels(f.fields));
  }
  return out;
}
