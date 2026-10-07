// Pages that use the Nocturne look (own header layout, footer, loading screen and a solid backdrop
// over the animated sky). In the customization studio only the purpose path has been moved over
// so far; the other studio paths keep the original storefront look.
export function isNocturneStudio(search = '') {
  const path = new URLSearchParams(search).get('path') || 'purpose';
  return path === 'purpose';
}

export function isNocturnePath(pathname = '', search = '') {
  const path = String(pathname).replace(/\/+$/, '') || '/';
  if (path === '/customize') return isNocturneStudio(search);
  return !/^\/(customize|shop-by-purpose)(\/|$)/.test(path);
}
