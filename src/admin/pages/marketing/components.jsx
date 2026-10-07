// Shared UI for the marketing pages (coupons, offers, flash sales, banners).
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useApiQuery } from '../../lib/query';
import { Badge, Checkbox, Field, FormGrid, Input, Skeleton, cx } from '../../ui';
import { SCHEDULE_META, formatCountdown, idOf, localZone, scheduleStatus, useNow } from './schedule';

/**
 * Start/end datetime-local pair. Values are local strings (from toLocalInput); convert with
 * fromLocalInput before sending. Optional dates can be cleared (sent as null by the page).
 */
export function ScheduleFields({ form, required = false, startLabel = 'Starts', endLabel = 'Ends' }) {
  const zone = localZone();
  const clearBtn = (key) =>
    !required && form.values[key] ? (
      <button type="button" className="text-xs text-lilac hover:text-ivory" onClick={() => form.set(key, '')}>
        Clear
      </button>
    ) : null;
  return (
    <div className="space-y-1.5">
      <FormGrid>
        <Field label={startLabel} required={required} error={form.errors.startsAt} hint={required ? undefined : 'Empty = starts right away.'}>
          {({ id }) => (
            <div className="flex items-center gap-2">
              <Input id={id} type="datetime-local" {...form.bind('startsAt')} />
              {clearBtn('startsAt')}
            </div>
          )}
        </Field>
        <Field label={endLabel} required={required} error={form.errors.endsAt} hint={required ? undefined : 'Empty = never ends.'}>
          {({ id }) => (
            <div className="flex items-center gap-2">
              <Input id={id} type="datetime-local" min={form.values.startsAt || undefined} {...form.bind('endsAt')} />
              {clearBtn('endsAt')}
            </div>
          )}
        </Field>
      </FormGrid>
      <p className="text-[11px] text-lilac/70">Times are in your timezone ({zone}).</p>
    </div>
  );
}

/** Badge for a scheduled record; `meta` lets flash sales say Live/Ended. */
export function ScheduleBadge({ row, meta = SCHEDULE_META, status }) {
  const s = status || scheduleStatus(row);
  const m = meta[s] || SCHEDULE_META[s];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** "Ends in 3h 12m" / "Starts in 2d 4h" ticking every second. */
export function Countdown({ startsAt, endsAt, isActive = true, className }) {
  const now = useNow(1000);
  if (isActive === false) return null;
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;
  let text = null;
  if (start && now < start) text = `Starts in ${formatCountdown(start - now)}`;
  else if (end && now <= end) text = `Ends in ${formatCountdown(end - now)}`;
  if (!text) return null;
  return <span className={cx('tabular-nums text-xs text-lilac', className)}>{text}</span>;
}

/** Multi-select of categories (checklist with filter + removable chips). value: id[] */
export function CategoryMultiSelect({ value = [], onChange, invalid }) {
  const { data, isLoading } = useApiQuery('/categories/admin/all');
  const [q, setQ] = useState('');
  const cats = useMemo(() => data?.categories || [], [data]);
  const byId = useMemo(() => Object.fromEntries(cats.map((c) => [idOf(c), c])), [cats]);
  const selected = value.map(idOf);
  const set = new Set(selected);
  const shown = cats.filter((c) => !q || c.name?.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => onChange(set.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 && <p className="text-xs text-lilac">No categories selected.</p>}
        {selected.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-xs text-ivory">
            {byId[id]?.name || (isLoading ? '…' : 'Deleted category')}
            <button type="button" aria-label="Remove category" className="text-lilac hover:text-rose-300" onClick={() => toggle(id)}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className={cx('rounded-xl border bg-raised', invalid ? 'border-rose-400/60' : 'border-white/10')}>
        {cats.length > 8 && (
          <div className="border-b border-white/[0.06] p-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter categories…" className="h-8 text-xs" />
          </div>
        )}
        <div className="max-h-52 overflow-y-auto p-1">
          {isLoading ? (
            <div className="space-y-1 p-1">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : shown.length === 0 ? (
            <p className="px-2 py-3 text-xs text-lilac">No categories found.</p>
          ) : (
            shown.map((c) => (
              <label key={c._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ivory hover:bg-white/[0.04]">
                <Checkbox checked={set.has(idOf(c))} onChange={() => toggle(idOf(c))} />
                <span className={cx('truncate', c.parentId && 'pl-3 text-lilac')}>{c.name}</span>
                {c.isActive === false && <span className="text-[11px] text-lilac/70">(hidden)</span>}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Small explanatory callout. */
export function Note({ icon: Icon, children, tone = 'neutral' }) {
  const cls = tone === 'warning' ? 'border-amber-300/25 bg-amber-400/[0.06] text-amber-100' : 'border-white/[0.08] bg-white/[0.03] text-lilac';
  return (
    <div className={cx('flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed', cls)}>
      {Icon && <Icon size={14} className="mt-0.5 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
