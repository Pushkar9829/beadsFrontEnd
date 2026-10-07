import { MutationCache, QueryCache, QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { toast } from '../../lib/adminToast';

/**
 * Admin data layer.
 *
 * Every read goes through useApiQuery, keyed by [url, params], so two screens showing the same
 * resource share one cache entry. Every write goes through useApiMutation, which invalidates the
 * affected URL prefixes afterwards — that is what keeps lists, details, counters and badges in sync.
 */

// A 401 anywhere means the session expired or was revoked (logout elsewhere, role change,
// account disabled): drop the user so RequireAdmin sends them to the sign-in page.
function handleAuthError(err) {
  if (errorInfo(err).status !== 401) return;
  import('../../store/authStore').then(({ useAuthStore }) => {
    if (useAuthStore.getState().user) {
      toast('Your session has ended. Please sign in again.', 'error');
      useAuthStore.setState({ user: null });
    }
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Retrying a 4xx never helps (auth, validation, not found).
      retry: (count, err) => !(err?.status >= 400 && err?.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
});

/** Normalised error: { status, message, fields? } */
export function errorInfo(err) {
  const status = err?.status ?? err?.response?.status ?? 0;
  const data = err?.response?.data || {};
  let message = data.message || err?.message || 'Something went wrong.';
  if (status === 0 && /network/i.test(message)) message = 'Cannot reach the server. Check your connection.';
  if (status === 403 && !data.message) message = 'You do not have permission to do this.';
  const fields = data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors) ? data.errors : null;
  return { status, message, fields, data };
}

function cleanParams(params) {
  if (!params) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    // 'all' means "no filter" for list filters; `role` is the exception (the API has a real role=all).
    if (v === undefined || v === null || v === '' || (v === 'all' && k !== 'role')) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function apiGet(url, params) {
  const { data } = await api.get(url, { params: cleanParams(params) });
  return data;
}

export async function apiSend(method, url, body, config) {
  const { data } = await api.request({ method, url, data: body, ...config });
  return data;
}

/** GET with caching. `params` participate in the cache key; empty values are dropped. */
export function useApiQuery(url, params, options = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: [url, clean || {}],
    queryFn: () => apiGet(url, clean),
    enabled: Boolean(url) && options.enabled !== false,
    placeholderData: options.keepPrevious === false ? undefined : keepPreviousData,
    ...options,
  });
}

/**
 * Paged list helper. Accepts the many list shapes the API returns and always yields
 * { rows, pagination: { page, limit, total, pages }, raw }.
 */
export function useApiList(url, params, { key, ...options } = {}) {
  const query = useApiQuery(url, params, options);
  const raw = query.data;
  const rows = pickRows(raw, key);
  const p = raw?.pagination || raw?.meta || {};
  const limit = Number(p.limit) || Number(params?.limit) || rows.length || 20;
  const total = Number.isFinite(Number(p.total)) ? Number(p.total) : rows.length;
  const pagination = {
    page: Number(p.page) || Number(params?.page) || 1,
    limit,
    total,
    pages: Number(p.pages) || Math.max(1, Math.ceil(total / (limit || 1))),
  };
  return { ...query, rows, pagination, raw };
}

export function pickRows(raw, key) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (key && Array.isArray(raw[key])) return raw[key];
  const arrays = Object.entries(raw).filter(([k, v]) => Array.isArray(v) && k !== 'errors');
  return arrays.length ? arrays[0][1] : [];
}

/**
 * Mutation with consistent UX:
 *  - `invalidate`: URL prefixes (strings) whose cached queries are refreshed on success
 *  - `success`: toast text (string or fn(data, vars)); false to stay quiet
 *  - errors toast automatically; 409 conflicts also refresh the invalidated queries,
 *    so the screen shows the current server state instead of a stale copy.
 */
export function useApiMutation(fn, { invalidate = [], success = 'Saved.', onSuccess, onError, silentError = false } = {}) {
  const qc = useQueryClient();
  const refresh = () =>
    Promise.all(
      invalidate.map((prefix) =>
        qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith(prefix) })
      )
    );
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data, vars, ctx) => {
      await refresh();
      const text = typeof success === 'function' ? success(data, vars) : success;
      if (text) toast(text);
      onSuccess?.(data, vars, ctx);
    },
    onError: async (err, vars, ctx) => {
      const info = errorInfo(err);
      if (info.status === 409) await refresh();
      if (!silentError) toast(info.message, 'error');
      onError?.(info, vars, ctx);
    },
  });
}

/**
 * Build an update payload from form values: empty strings in `nullable` keys become null so the
 * API clears them (instead of silently keeping the old value), numeric keys become numbers.
 */
export function toPayload(values, { nullable = [], numbers = [], omit = [] } = {}) {
  const out = { ...values };
  for (const k of omit) delete out[k];
  for (const k of numbers) {
    if (out[k] === '' || out[k] === null || out[k] === undefined) continue;
    const n = Number(out[k]);
    out[k] = Number.isFinite(n) ? n : out[k];
  }
  for (const k of nullable) {
    if (out[k] === '' || out[k] === undefined) out[k] = null;
  }
  delete out._id;
  delete out.__v;
  delete out.createdAt;
  delete out.updatedAt;
  return out;
}

export { useQueryClient };
