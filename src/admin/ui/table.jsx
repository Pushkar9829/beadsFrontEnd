import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, IconButton, Skeleton, cx } from './primitives';
import { Checkbox, inputBase } from './form';
import { number } from '../lib/format';

/**
 * columns: [{ key, header, render?(row), sortable?, align?: 'right'|'center', width?, className?, hideBelow?: 'sm'|'md'|'lg' }]
 * sort: { key, dir: 'asc'|'desc' }  onSort(key)
 * selection: { selected: Set<id>, onChange(Set) }  (enables checkboxes)
 */
export function DataTable({
  columns,
  rows = [],
  rowKey = (r) => r._id || r.id,
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  empty,
  onRowClick,
  sort,
  onSort,
  selection,
  dense = false,
  footer,
  className,
}) {
  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  const align = { right: 'text-right', center: 'text-center' };
  const ids = rows.map(rowKey);
  const allSelected = selection && ids.length > 0 && ids.every((id) => selection.selected.has(id));
  const someSelected = selection && ids.some((id) => selection.selected.has(id));
  const toggleAll = () => {
    const next = new Set(selection.selected);
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    selection.onChange(next);
  };
  const toggleOne = (id) => {
    const next = new Set(selection.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };
  const pad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cx('overflow-hidden rounded-2xl border border-white/[0.08] bg-surface', className)}>
      <div className={cx('relative overflow-x-auto', fetching && !loading && 'opacity-70 transition-opacity')}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-wider text-lilac">
              {selection && (
                <th className={cx('w-10', pad)}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} aria-label="Select all rows" />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} style={{ width: c.width }} className={cx('whitespace-nowrap font-medium', pad, align[c.align], hide[c.hideBelow])}>
                    {c.sortable && onSort ? (
                      <button type="button" onClick={() => onSort(c.key)} className={cx('inline-flex items-center gap-1 hover:text-ivory', active && 'text-ivory')}>
                        {c.header}
                        {active ? sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ChevronsUpDown size={12} className="opacity-50" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk${i}`} className="border-b border-white/[0.05]">
                  {selection && <td className={pad} />}
                  {columns.map((c) => (
                    <td key={c.key} className={cx(pad, hide[c.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-[10rem]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              !error &&
              rows.map((row) => {
                const id = rowKey(row);
                const isSel = selection?.selected.has(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cx(
                      'border-b border-white/[0.05] last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none',
                      isSel && 'bg-gold/[0.05]'
                    )}
                  >
                    {selection && (
                      <td className={pad} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => toggleOne(id)} aria-label="Select row" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cx('align-middle text-ivory', pad, align[c.align], hide[c.hideBelow], c.className)}>
                        {c.render ? c.render(row) : row[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
        {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
        {!loading && !error && rows.length === 0 && (empty || <EmptyState />)}
      </div>
      {footer}
    </div>
  );
}

/** Footer pagination. pagination: { page, pages, total, limit } */
export function Pagination({ pagination, onPage, className }) {
  if (!pagination) return null;
  const { page = 1, pages = 1, total = 0, limit = 20 } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className={cx('flex items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-2.5 text-xs text-lilac', className)}>
      <span>
        {total ? (
          <>
            {number(from)}–{number(to)} of {number(total)}
          </>
        ) : (
          'No results'
        )}
      </span>
      <div className="flex items-center gap-1">
        <IconButton icon={ChevronLeft} size="sm" label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <span className="px-2 tabular-nums">
          {page} / {Math.max(1, pages)}
        </span>
        <IconButton icon={ChevronRight} size="sm" label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
}

/** Debounced search box (300ms). */
export function SearchInput({ value = '', onChange, placeholder = 'Search…', className, autoFocus }) {
  const [draft, setDraft] = useState(value);
  const first = useRef(true);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  return (
    <div className={cx('relative w-full sm:w-64', className)}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lilac" />
      <input
        type="search"
        value={draft}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(inputBase, 'h-9 pl-8 pr-8')}
      />
      {draft && (
        <button type="button" aria-label="Clear search" onClick={() => { setDraft(''); onChange(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lilac hover:text-ivory">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Compact select for toolbars. options: [{value,label}] */
export function FilterSelect({ value, onChange, options, label, className }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputBase, 'h-9 w-auto pr-8', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Filter/search row above a table. */
export function Toolbar({ children, right, className }) {
  return (
    <div className={cx('mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** Segmented tabs used as a quick filter (e.g. order status). items: [{value,label,count}] */
export function Segmented({ items, value, onChange, className, label = 'Filter' }) {
  return (
    <div className={cx('flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-surface p-1', className)} role="tablist" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cx(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
            value === it.value ? 'bg-white/[0.1] text-ivory' : 'text-lilac hover:text-ivory'
          )}
        >
          {it.label}
          {it.count != null && <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px] tabular-nums">{number(it.count)}</span>}
        </button>
      ))}
    </div>
  );
}

/** Sticky bar shown when rows are selected. */
export function BulkBar({ count, onClear, children }) {
  if (!count) return null;
  return (
    <div className="sticky bottom-4 z-20 mx-auto mt-3 flex w-fit items-center gap-3 rounded-xl border border-gold/30 bg-raised px-4 py-2 shadow-2xl">
      <span className="text-sm text-ivory">{number(count)} selected</span>
      <div className="flex items-center gap-2">{children}</div>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

/** Client-side sort helper for endpoints without server sorting. */
export function sortRows(rows, sort, accessors = {}) {
  if (!sort?.key) return rows;
  const get = accessors[sort.key] || ((r) => r[sort.key]);
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir;
  });
}

export function nextSort(sort, key) {
  if (sort?.key !== key) return { key, dir: 'desc' };
  return { key, dir: sort.dir === 'desc' ? 'asc' : 'desc' };
}
