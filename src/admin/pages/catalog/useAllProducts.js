import { apiGet, useApiQuery } from '../../lib/query';

/**
 * Loads every product (paging through /products/admin/all 100 at a time).
 * Needed because manual collection membership lives on Product.collectionIds and the API has no
 * `collectionId` filter yet. Cached under the `/products/admin` prefix so product writes refresh it.
 */
export function useAllProducts({ enabled = true } = {}) {
  return useApiQuery(
    '/products/admin/all',
    { scan: 'all' },
    {
      enabled,
      keepPrevious: false,
      staleTime: 15_000,
      queryFn: async () => {
        const all = [];
        let page = 1;
        let pages = 1;
        do {
          const res = await apiGet('/products/admin/all', { page, limit: 100, sort: 'name' });
          all.push(...(res?.products || []));
          pages = Number(res?.pagination?.pages) || 1;
          page += 1;
        } while (page <= pages && page <= 100);
        return all;
      },
    }
  );
}
