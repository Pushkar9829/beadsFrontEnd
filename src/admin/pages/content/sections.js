import { pickHome } from '../../../lib/homeContent';
import { getPath, setPath } from '../../ui';
import { schemaLabels } from './schema';
import { HOME_SECTIONS, SITE_SECTIONS } from './sectionsHome';
import { LEGAL_SECTIONS, PAGE_SECTIONS, STUDIO_SECTIONS } from './sectionsPages';

export const SECTIONS = [...HOME_SECTIONS, ...SITE_SECTIONS, ...PAGE_SECTIONS, ...STUDIO_SECTIONS, ...LEGAL_SECTIONS].map((s) => ({
  ...s,
  paths: s.paths || [s.base],
  search: [s.label, s.hint, s.group, ...schemaLabels(s.fields)].join(' ').toLowerCase(),
}));

export const SECTION_GROUPS = ['Homepage', 'Site-wide', 'Pages', 'Studio', 'Legal'];

export const sectionByKey = (key) => SECTIONS.find((s) => s.key === key);

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export const stable = (v) => JSON.stringify(v ?? null);

/**
 * The editable slice of the content document for one section, e.g. { pages: { shop: {...} } }.
 * Client-side defaults (pickHome) fill gaps such as studio labels the server has no default for.
 */
export function sectionValues(content, section) {
  const merged = pickHome(content || {});
  let out = {};
  for (const path of section.paths) out = setPath(out, path, clone(getPath(merged, path)));
  return section.prepare ? section.prepare(out) : out;
}

/**
 * Body for PUT /admin/content: only the top-level keys this section lives under. Nested sections
 * (pages.*) are patched into the *fresh* server copy of their top-level key, so other sub-pages
 * edited meanwhile are kept. `null` values make the server restore its default for that path.
 */
export function buildBody(freshContent, section, values) {
  const tops = [...new Set(section.paths.map((p) => p.split('.')[0]))];
  let doc = {};
  for (const top of tops) doc[top] = clone(freshContent?.[top]);
  for (const path of section.paths) doc = setPath(doc, path, values === null ? null : clone(getPath(values, path)));
  return Object.fromEntries(tops.map((top) => [top, doc[top] ?? null]));
}
