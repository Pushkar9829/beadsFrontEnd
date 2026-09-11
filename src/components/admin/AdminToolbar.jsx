import { Search } from 'lucide-react';
import { fieldClass } from './AdminHeader';

export default function AdminToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  extra,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {onSearch && (
        <label className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lilac" />
          <input
            className={`${fieldClass} pl-9`}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
      )}
      {filters}
      {extra}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, className = '' }) {
  return (
    <select className={`${fieldClass} w-auto min-w-[140px] ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Pagination({ page, pages, onPage, total, pageSize }) {
  if (pages <= 1 && !total) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-lilac">
      <span>{total != null ? `${total} records` : ''}{pageSize ? ` · ${pageSize} per page` : ''}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full border border-gold/30 px-3 py-1 disabled:opacity-40">Prev</button>
        <span className="px-2 py-1">{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-full border border-gold/30 px-3 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

export function paginate(rows, page, pageSize = 20) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { slice: rows.slice((p - 1) * pageSize, p * pageSize), total, pages, page: p };
}
