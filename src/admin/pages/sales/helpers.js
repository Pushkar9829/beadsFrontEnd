// Shared helpers for the sales pages (dashboard, analytics, orders, returns, carts, notifications).
import { useCallback, useState } from 'react';
import api, { mediaUrl } from '../../../api/client';
import { toast } from '../../../lib/adminToast';
import { downloadFile } from '../../lib/format';
import { errorInfo } from '../../lib/query';
import { useUrlState } from '../../lib/urlState';

/** Everything an order write can change. */
export const ORDER_INVALIDATE = [
  '/orders/admin',
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/returns',
  '/admin/notifications',
  '/admin/inventory',
  '/admin/customers',
  // cancel restores and "mark paid" deducts stock for products and bracelet beads
  '/products/admin',
  '/customizer/admin/beads',
];
/** Everything a return write can change. */
export const RETURN_INVALIDATE = ['/admin/returns', '/orders/admin', '/admin/dashboard', '/admin/inventory', '/products/admin'];

export const RANGE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '12 months' },
  { value: 'custom', label: 'Custom' },
];

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** yyyy-mm-dd for today in local time (max value for date inputs). */
export function todayInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Report date range kept in the URL (?range=30d or ?range=custom&from=…&to=…).
 * Returns the API params plus a validation message for incomplete custom ranges, so the page
 * never silently queries a different range than the one on screen.
 */
export function useReportRange(defaultRange = '30d') {
  const [state, set] = useUrlState({ range: defaultRange, from: '', to: '' });
  let params = null;
  let problem = null; // blocks the query
  let notice = null; // informational
  if (state.range === 'custom') {
    if (!DAY_RE.test(state.from) || !DAY_RE.test(state.to)) problem = 'Pick a start and end date.';
    else if (state.from > state.to) problem = 'The start date must be on or before the end date.';
    else {
      params = { from: state.from, to: state.to };
      const days = (new Date(state.to) - new Date(state.from)) / 86_400_000;
      if (days > 366) notice = 'Reports cover at most 366 days, so only the last 366 days of this range are shown.';
    }
  } else {
    params = { range: RANGE_PRESETS.some((p) => p.value === state.range) ? state.range : defaultRange };
  }
  const label =
    state.range === 'custom'
      ? state.from && state.to
        ? `${state.from} → ${state.to}`
        : 'Custom range'
      : RANGE_PRESETS.find((p) => p.value === params?.range)?.label || '';
  return { state, set, params, problem, notice, label };
}

/** Converts yyyy-mm-dd (local) to an ISO instant at the start or end of that day. */
export function dayToIso(day, end = false) {
  if (!DAY_RE.test(day || '')) return undefined;
  const d = new Date(`${day}T${end ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Reads `{ message }` out of a failed blob request (the body arrives as a Blob, not JSON). */
async function blobErrorMessage(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch {
      /* not JSON */
    }
  }
  return errorInfo(err).message;
}

/** CSV download through the authenticated API client, with busy state and error toast. */
export function useCsvDownload() {
  const [busy, setBusy] = useState(null);
  const download = useCallback(async (url, params, filename, key = url) => {
    setBusy(key);
    try {
      const clean = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all'));
      const res = await api.get(url, { params: clean, responseType: 'blob' });
      downloadFile(res.data, filename);
      toast('Export downloaded.');
    } catch (err) {
      toast(await blobErrorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  }, []);
  return { download, busy };
}

/** Image for an order/cart line (product snapshot image, or the first bead of a custom bracelet). */
export function lineImage(item) {
  const s = item?.snapshot || item || {};
  const src = s.image || s.images?.[0] || s.beads?.find((b) => b?.image)?.image || item?.image;
  return src ? mediaUrl(typeof src === 'string' ? src : src.url) : '';
}

export function lineName(item) {
  return item?.snapshot?.name || item?.name || (item?.kind === 'custom_bracelet' ? 'Custom bracelet' : 'Item');
}

/** Renders loosely-typed snapshot values (string, number, or { name | label | title }). */
export function text(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(', ');
  if (typeof v === 'object') return text(v.name ?? v.label ?? v.title ?? v.value ?? v.number ?? '');
  return String(v);
}

export function customerName(order) {
  return order?.contactName || order?.shippingAddress?.name || order?.userId?.name || order?.email || 'Guest';
}

/** Notification links are generic (/admin/orders); point to the exact order when we know it. */
export function notificationTarget(n) {
  const link = typeof n?.link === 'string' && n.link.startsWith('/admin') ? n.link : null;
  const orderId = n?.meta?.orderId;
  if (orderId && (!link || link === '/admin/orders')) return `/admin/orders/${orderId}`;
  if (link === '/admin/inventory/low') return '/admin/inventory?stock=low';
  return link;
}

export const NOTIFICATION_TYPES = {
  new_order: { label: 'New order', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
  refund_required: { label: 'Refund needed', tone: 'danger' },
  new_customer: { label: 'New customer', tone: 'info' },
  abandoned_cart: { label: 'Abandoned cart', tone: 'neutral' },
  return: { label: 'Return', tone: 'warning' },
  contact: { label: 'Message', tone: 'info' },
  system: { label: 'System', tone: 'accent' },
};

export const RETURN_REASONS = {
  wrong_product: 'Wrong product',
  damaged_in_transit: 'Damaged in transit',
  missing_item: 'Missing item',
  not_as_described: 'Not as described',
  defect: 'Defect',
  change_of_mind: 'Change of mind',
  other: 'Other',
};

export const roundMoney = (n) => Math.round((Number(n) || 0) * 100) / 100;
