// Shared helpers for scheduled marketing records (coupons, offers, flash sales, banners).
import { useEffect, useState } from 'react';
import { fromLocalInput } from '../../lib/format';

/**
 * Mirrors backend `couponStatus`: inactive → scheduled (starts in the future) → expired (ended) → active.
 * Works for any record with { isActive, startsAt?, endsAt? }.
 */
export function scheduleStatus(row, now = Date.now()) {
  if (!row || row.isActive === false) return 'inactive';
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  if (row.startsAt && new Date(row.startsAt).getTime() > t) return 'scheduled';
  if (row.endsAt && new Date(row.endsAt).getTime() < t) return 'expired';
  return 'active';
}

export const SCHEDULE_META = {
  active: { label: 'Active', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Expired', tone: 'neutral' },
  inactive: { label: 'Inactive', tone: 'warning' },
};

/** Flash sales use storefront wording: live / scheduled / ended / off. */
export const SALE_META = {
  active: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Ended', tone: 'neutral' },
  inactive: { label: 'Off', tone: 'warning' },
};

/**
 * Validates datetime-local strings. Returns an errors object ({ startsAt?, endsAt? }).
 * `required` makes both dates mandatory (flash sales).
 */
export function scheduleErrors(values, { required = false } = {}) {
  const errors = {};
  const start = fromLocalInput(values.startsAt);
  const end = fromLocalInput(values.endsAt);
  if (values.startsAt && !start) errors.startsAt = 'Enter a valid date and time.';
  if (values.endsAt && !end) errors.endsAt = 'Enter a valid date and time.';
  if (required && !values.startsAt) errors.startsAt = 'Start is required.';
  if (required && !values.endsAt) errors.endsAt = 'End is required.';
  if (start && end && new Date(end) <= new Date(start)) errors.endsAt = 'End must be after the start.';
  return errors;
}

/** "2d 4h", "3h 12m", "4m 09s" */
export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function randomCode(length = 8, prefix = '') {
  const bytes = new Uint32Array(length);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 2 ** 32);
  let out = '';
  for (let i = 0; i < length; i += 1) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return `${prefix}${out}`;
}

export const idOf = (v) => String(v?._id ?? v ?? '');

/** The browser's timezone name for hints ("Asia/Kolkata"). */
export function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
}

/** Client-side pagination for small unpaginated endpoints. */
export function paginate(rows, page, limit = 25) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const p = Math.min(Math.max(1, page), pages);
  return { slice: rows.slice((p - 1) * limit, p * limit), pagination: { page: p, pages, total, limit } };
}

/** Re-renders every `interval` ms and returns Date.now(); used for live countdowns. */
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}
