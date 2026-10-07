// Pages that use the Nocturne look (own header layout, footer, loading screen and a solid backdrop
// over the animated sky). Everything else keeps the original storefront look for now.
const HOUSES = ['crystals', 'rudraksha', 'gemstones'];

export function isNocturnePath(pathname = '', houseSlugs = HOUSES) {
  const path = String(pathname).replace(/\/+$/, '') || '/';
  if (path === '/') return true;
  if (/^\/c\/[^/]+$/.test(path)) return true;
  const slug = path.slice(1);
  return [...new Set([...HOUSES, ...houseSlugs])].includes(slug);
}
