// Shared UI for the studio admin pages (kit-only building blocks that the generic kit does not have yet).
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { money } from '../../lib/format';
import { Badge, Button, EmptyState, Field, FormGrid, IconButton, Input, Modal, NumberInput, SearchInput, Select, cx } from '../../ui';
import { MONTHS, isHexColor } from './api';

/** Colour swatch + hex text input. Empty value is allowed (means "automatic"). */
export function ColorInput({ id, value = '', onChange, placeholder = '#C6A75E', invalid }) {
  const valid = isHexColor(value);
  const swatch = valid ? (value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value) : '#000000';
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ background: valid ? value : 'repeating-conic-gradient(#ffffff14 0 25%, transparent 0 50%) 50% / 10px 10px' }}>
        <span className="sr-only">Pick colour</span>
        <input type="color" value={swatch} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <Input id={id} value={value || ''} onChange={(e) => onChange(e.target.value.trim())} placeholder={placeholder} invalid={invalid || (value && !valid)} className="font-mono" />
    </div>
  );
}

/** cardBg / cardAccent pair used by purpose, intention and layer cards on the storefront. */
export function CardColorFields({ values, set }) {
  return (
    <FormGrid>
      <Field label="Card background" hint="Leave empty to derive it from the name.">
        {({ id }) => <ColorInput id={id} value={values.cardBg} onChange={(v) => set('cardBg', v)} placeholder="Automatic" />}
      </Field>
      <Field label="Card accent" hint="Border and glow colour.">
        {({ id }) => <ColorInput id={id} value={values.cardAccent} onChange={(v) => set('cardAccent', v)} placeholder="Automatic" />}
      </Field>
    </FormGrid>
  );
}

/** Round bead swatch: image when present, otherwise its colour. */
export function BeadThumb({ bead, size = 36 }) {
  if (bead?.image) {
    return <img src={mediaUrl(bead.image)} alt="" loading="lazy" className="shrink-0 rounded-full border border-white/10 bg-raised object-cover" style={{ width: size, height: size }} />;
  }
  return <span className="shrink-0 rounded-full border border-white/10" style={{ width: size, height: size, background: bead?.colorHex || 'rgba(255,255,255,0.06)' }} />;
}

/**
 * Searchable bead chooser.
 *   single:   onPick(bead)
 *   multiple: onPick(beads[])
 * `exclude`: ids that cannot be picked (already in the list).
 */
export function BeadPickerModal({ open, onClose, beads = [], onPick, multiple = false, exclude = [], title }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState([]);
  const excluded = useMemo(() => new Set(exclude.map(String)), [exclude]);
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return beads.filter((b) => !term || b.name?.toLowerCase().includes(term) || b.chakra?.toLowerCase().includes(term));
  }, [beads, q]);
  const close = () => {
    setPicked([]);
    setQ('');
    onClose();
  };
  const toggle = (bead) => {
    if (!multiple) {
      onPick(bead);
      close();
      return;
    }
    setPicked((prev) => (prev.some((b) => b._id === bead._id) ? prev.filter((b) => b._id !== bead._id) : [...prev, bead]));
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={title || (multiple ? 'Add beads' : 'Choose a bead')}
      size="lg"
      footer={
        multiple && (
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!picked.length}
              onClick={() => {
                onPick(picked);
                close();
              }}
            >
              {picked.length ? `Add ${picked.length} bead${picked.length === 1 ? '' : 's'}` : 'Add beads'}
            </Button>
          </>
        )
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Search beads…" className="mb-4 sm:w-full" autoFocus />
      {visible.length === 0 ? (
        <EmptyState title={beads.length ? 'No beads match your search' : 'No beads yet'} description={beads.length ? undefined : 'Create beads on the Beads page first.'} />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visible.map((bead) => {
            const isExcluded = excluded.has(String(bead._id));
            const order = picked.findIndex((b) => b._id === bead._id);
            return (
              <button
                key={bead._id}
                type="button"
                disabled={isExcluded}
                onClick={() => toggle(bead)}
                className={cx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  order >= 0 ? 'border-gold/60 bg-gold/[0.06]' : 'border-white/10 hover:border-gold/40'
                )}
              >
                <BeadThumb bead={bead} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ivory">{bead.name}</span>
                  <span className="block truncate text-xs text-lilac">
                    {money(bead.pricePerBead)} / bead{bead.chakra ? ` · ${bead.chakra}` : ''}
                  </span>
                </span>
                {isExcluded ? (
                  <span className="text-[11px] text-lilac">Added</span>
                ) : bead.isActive === false ? (
                  <Badge>Hidden</Badge>
                ) : null}
                {order >= 0 && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gold text-[10px] font-semibold text-ink">
                    {multiple ? order + 1 : <Check size={12} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/** Single bead field: shows the chosen bead and opens the picker. value: bead id. */
export function BeadField({ beads, value, onChange, fallback, invalid }) {
  const [open, setOpen] = useState(false);
  const bead = beads.find((b) => b._id === value) || (fallback && fallback._id === value ? fallback : null);
  return (
    <div className={cx('flex items-center gap-3 rounded-lg border bg-raised px-3 py-2', invalid ? 'border-rose-400/60' : 'border-white/10')}>
      {bead ? (
        <>
          <BeadThumb bead={bead} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ivory">{bead.name}</span>
            <span className="block text-xs text-lilac">
              {bead.pricePerBead != null ? `${money(bead.pricePerBead)} / bead` : ''}
              {bead.isActive === false ? ' · hidden' : ''}
            </span>
          </span>
        </>
      ) : (
        <span className="flex-1 text-sm text-lilac">{value ? 'This bead no longer exists' : 'No bead chosen'}</span>
      )}
      <Button size="sm" onClick={() => setOpen(true)}>
        {bead ? 'Change' : 'Choose bead'}
      </Button>
      <BeadPickerModal open={open} onClose={() => setOpen(false)} beads={beads} onPick={(b) => onChange(b._id)} />
    </div>
  );
}

/**
 * Ordered list of bead NAMES (layer catalogs reference beads by name).
 * Names that match no bead are kept and flagged so nothing is lost silently.
 */
export function BeadNameListField({ beads, value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const byName = useMemo(() => new Map(beads.map((b) => [b.name.trim().toLowerCase(), b])), [beads]);
  const exclude = beads.filter((b) => value.some((n) => n.trim().toLowerCase() === b.name.trim().toLowerCase())).map((b) => b._id);
  return (
    <div className="space-y-2">
      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-lilac">No beads yet.</p>
      ) : (
        <ol className="space-y-1.5">
          {value.map((name, i) => {
            const bead = byName.get(name.trim().toLowerCase());
            return (
              <li key={`${name}-${i}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-raised px-2 py-1.5">
                <span className="w-5 text-center text-xs tabular-nums text-lilac">{i + 1}</span>
                <BeadThumb bead={bead} size={24} />
                <span className="min-w-0 flex-1 truncate text-sm text-ivory">{name}</span>
                {!bead && <Badge tone="warning">Not in bead list</Badge>}
                {bead?.isActive === false && <Badge>Hidden</Badge>}
                <IconButton icon={ArrowUp} size="sm" label="Move up" disabled={i === 0} onClick={() => onChange(moveIn(value, i, i - 1))} />
                <IconButton icon={ArrowDown} size="sm" label="Move down" disabled={i === value.length - 1} onClick={() => onChange(moveIn(value, i, i + 1))} />
                <IconButton icon={X} size="sm" label={`Remove ${name}`} onClick={() => onChange(value.filter((_, j) => j !== i))} />
              </li>
            );
          })}
        </ol>
      )}
      <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>
        Add beads
      </Button>
      <BeadPickerModal open={open} onClose={() => setOpen(false)} beads={beads} multiple exclude={exclude} onPick={(picked) => onChange([...value, ...picked.map((b) => b.name)])} />
    </div>
  );
}

function moveIn(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Editable list of object rows (finishes, thread types, CZ options, studio paths).
 * Rows need a stable `_k`. render(row, update(patch), index) returns the row's fields.
 */
export function RowListEditor({ rows = [], onChange, render, makeRow, addLabel = 'Add row', title, minRows = 0, emptyText = 'Nothing added yet.', fixed = false }) {
  const update = (i, patch) => onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-lilac">{emptyText}</p>}
      {rows.map((row, i) => (
        <div key={row._k || i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-lilac">{title ? title(row, i) : `#${i + 1}`}</span>
            <div className="flex items-center gap-1">
              <IconButton icon={ArrowUp} size="sm" label="Move up" disabled={i === 0} onClick={() => onChange(moveIn(rows, i, i - 1))} />
              <IconButton icon={ArrowDown} size="sm" label="Move down" disabled={i === rows.length - 1} onClick={() => onChange(moveIn(rows, i, i + 1))} />
              {!fixed && <IconButton icon={Trash2} size="sm" label="Remove" disabled={rows.length <= minRows} onClick={() => onChange(rows.filter((_, j) => j !== i))} />}
            </div>
          </div>
          {render(row, (patch) => update(i, patch), i)}
        </div>
      ))}
      {!fixed && (
        <Button size="sm" icon={Plus} onClick={() => onChange([...rows, makeRow()])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label }));

/** From/to day-month pair for zodiac ranges. Keys: fromMonth, fromDay, toMonth, toDay. */
export function DateRangeFields({ values, set, errors = {} }) {
  const part = (monthKey, dayKey, label) => (
    <Field label={label} error={errors[monthKey] || errors[dayKey]}>
      <div className="flex gap-2">
        <NumberInput aria-label={`${label} day`} min={1} max={31} value={values[dayKey]} onChange={(v) => set(dayKey, v)} className="w-20" placeholder="Day" />
        <Select aria-label={`${label} month`} options={MONTH_OPTIONS} placeholder="Month" value={values[monthKey] ?? ''} onChange={(e) => set(monthKey, e.target.value === '' ? '' : Number(e.target.value))} />
      </div>
    </Field>
  );
  return (
    <FormGrid>
      {part('fromMonth', 'fromDay', 'From')}
      {part('toMonth', 'toDay', 'To')}
    </FormGrid>
  );
}
