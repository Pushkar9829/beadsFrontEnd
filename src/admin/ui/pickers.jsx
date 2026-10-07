import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { useApiList, useApiQuery } from '../lib/query';
import { money } from '../lib/format';
import { Button, EmptyState, Skeleton, Thumb, cx } from './primitives';
import { Modal } from './overlay';
import { SearchInput } from './table';

/**
 * Multi-select products. value: array of product ids (strings).
 * Shows the selected products as removable chips and a searchable picker modal.
 */
export function ProductPicker({ value = [], onChange, max = 500, label = 'Add products' }) {
  const [open, setOpen] = useState(false);
  const ids = value.map(String);
  // Resolve names for selected ids (first 100 is enough for chips).
  const { rows: selectedRows } = useApiList('/products/admin/all', { ids: ids.slice(0, 100).join(','), limit: 100 }, { enabled: ids.length > 0, key: 'products' });
  const byId = useMemo(() => Object.fromEntries(selectedRows.map((p) => [String(p._id), p])), [selectedRows]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ids.length === 0 && <p className="text-xs text-lilac">No products selected.</p>}
        {ids.map((id) => (
          <span key={id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-raised py-1 pl-1 pr-2 text-xs text-ivory">
            <Thumb src={byId[id]?.images?.[0] ? mediaUrl(byId[id].images[0]) : ''} size={20} color={byId[id]?.colorHex} />
            <span className="truncate">{byId[id]?.name || 'Product'}</span>
            <button type="button" aria-label="Remove" className="text-lilac hover:text-rose-300" onClick={() => onChange(ids.filter((x) => x !== id))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <Button size="sm" icon={Plus} onClick={() => setOpen(true)} disabled={ids.length >= max}>
        {label}
      </Button>
      <ProductPickerModal open={open} onClose={() => setOpen(false)} selected={ids} onChange={onChange} max={max} />
    </div>
  );
}

export function ProductPickerModal({ open, onClose, selected = [], onChange, max = 500, single = false }) {
  const [q, setQ] = useState('');
  const { rows, isLoading } = useApiList('/products/admin/all', { q, limit: 50, sort: 'name' }, { enabled: open, key: 'products' });
  const set = new Set(selected.map(String));
  const toggle = (p) => {
    const id = String(p._id);
    if (single) {
      onChange([id], p);
      onClose();
      return;
    }
    if (set.has(id)) onChange(selected.filter((x) => String(x) !== id));
    else if (set.size < max) onChange([...selected.map(String), id]);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={single ? 'Choose a product' : 'Choose products'}
      size="lg"
      footer={
        !single && (
          <Button variant="primary" onClick={onClose}>
            Done ({set.size})
          </Button>
        )
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Search by name or SKU…" className="mb-3 sm:w-full" autoFocus />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
          {rows.map((p) => {
            const on = set.has(String(p._id));
            return (
              <li key={p._id}>
                <button type="button" onClick={() => toggle(p)} className={cx('flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.04]', on && 'bg-gold/[0.06]')}>
                  <Thumb src={p.images?.[0] ? mediaUrl(p.images[0]) : ''} size={36} color={p.colorHex} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ivory">{p.name}</span>
                    <span className="block text-xs text-lilac">
                      {money(p.price)} · {p.stock ?? 0} in stock{p.isActive === false ? ' · inactive' : ''}
                    </span>
                  </span>
                  <span className={cx('grid h-5 w-5 place-items-center rounded-md border', on ? 'border-gold bg-gold text-ink' : 'border-white/20')}>{on && <Check size={12} />}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

/** Category <select> fed by the admin category list. */
export function CategorySelect({ value, onChange, placeholder = 'No category', className, exclude }) {
  const { data, isLoading } = useApiQuery('/categories/admin/all');
  const cats = (data?.categories || []).filter((c) => String(c._id) !== String(exclude || ''));
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={isLoading}
      className={cx('h-9 w-full rounded-lg border border-white/10 bg-raised px-3 text-sm text-ivory focus:border-gold/60 focus:outline-none', className)}
    >
      <option value="">{isLoading ? 'Loading…' : placeholder}</option>
      {cats.map((c) => (
        <option key={c._id} value={c._id}>
          {c.parentId ? '— ' : ''}
          {c.name}
          {c.isActive === false ? ' (hidden)' : ''}
        </option>
      ))}
    </select>
  );
}
