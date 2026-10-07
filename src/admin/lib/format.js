import { formatInr } from '../../lib/format';

export const money = (v) => formatInr(Number(v) || 0);

export function number(v) {
  return new Intl.NumberFormat('en-IN').format(Number(v) || 0);
}

function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function date(v) {
  const d = toDate(v);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function dateTime(v) {
  const d = toDate(v);
  return d
    ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
}

export function relative(v) {
  const d = toDate(v);
  if (!d) return '—';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  const abs = Math.abs(s);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return fmt.format(-s, 'second');
  if (abs < 3600) return fmt.format(-Math.round(s / 60), 'minute');
  if (abs < 86400) return fmt.format(-Math.round(s / 3600), 'hour');
  if (abs < 86400 * 30) return fmt.format(-Math.round(s / 86400), 'day');
  return date(d);
}

/** yyyy-mm-ddThh:mm for <input type="datetime-local"> in local time */
export function toLocalInput(v) {
  const d = toDate(v);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v) {
  const d = toDate(v);
  return d ? d.toISOString() : null;
}

export function plural(n, one, many = `${one}s`) {
  return `${number(n)} ${Number(n) === 1 ? one : many}`;
}

export function initials(name = '') {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}

/** Downloads a Blob or text as a file (used by CSV exports). */
export function downloadFile(content, filename, type = 'text/csv;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
