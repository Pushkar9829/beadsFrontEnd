// Pages that use the Nocturne look (own header layout, footer, loading screen and a solid backdrop
// over the animated sky). The customization studio keeps the original storefront look for now.
export function isNocturnePath(pathname = '') {
  const path = String(pathname).replace(/\/+$/, '') || '/';
  return !/^\/(customize|shop-by-purpose)(\/|$)/.test(path);
}
