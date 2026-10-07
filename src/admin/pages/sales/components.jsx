// Shared UI pieces for the sales pages. Kit-only styling; no chart library.
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Input, Segmented, Thumb, cx } from '../../ui';
import { date, money, number } from '../../lib/format';
import { RANGE_PRESETS, lineImage, lineName, text, todayInput } from './helpers';

/** Preset segmented control + custom from/to date inputs, bound to useReportRange(). */
export function RangePicker({ range, presets = RANGE_PRESETS }) {
  const { state, set, problem, notice } = range;
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Segmented items={presets} value={state.range} onChange={(v) => set({ range: v, ...(v !== 'custom' ? { from: '', to: '' } : {}) })} />
      {state.range === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" aria-label="From date" value={state.from} max={state.to || todayInput()} onChange={(e) => set({ from: e.target.value })} className="w-auto" />
          <span className="text-xs text-lilac">to</span>
          <Input type="date" aria-label="To date" value={state.to} min={state.from || undefined} max={todayInput()} onChange={(e) => set({ to: e.target.value })} className="w-auto" />
        </div>
      )}
      {(problem || notice) && <p className={cx('text-xs', problem ? 'text-amber-200' : 'text-lilac')}>{problem || notice}</p>}
    </div>
  );
}

/**
 * Daily series bar chart (plain CSS). Accessible: a summary label + a visually hidden data table;
 * hover / keyboard focus shows the exact value of each day.
 */
export function SeriesChart({ series = [], valueKey = 'sales', format = money, label = 'Sales by day', height = 160 }) {
  const [active, setActive] = useState(null);
  const tableId = useId();
  const max = Math.max(1, ...series.map((s) => Number(s[valueKey]) || 0));
  const total = series.reduce((sum, s) => sum + (Number(s[valueKey]) || 0), 0);
  if (!series.length) return null;
  const current = active != null ? series[active] : null;
  const ticks = series.length > 2 ? [0, Math.floor((series.length - 1) / 2), series.length - 1] : series.map((_, i) => i);
  return (
    <figure aria-describedby={tableId}>
      <div className="mb-2 h-5 text-xs text-lilac" aria-live="polite">
        {current ? (
          <>
            <span className="text-ivory">{date(current.date)}</span> · {format(current[valueKey])}
            {current.orders != null && valueKey !== 'orders' ? ` · ${number(current.orders)} orders` : ''}
          </>
        ) : (
          <>Hover a bar for the daily figure.</>
        )}
      </div>
      <div className="relative flex items-end gap-[2px] border-b border-white/10" style={{ height }} onMouseLeave={() => setActive(null)}>
        {series.map((s, i) => {
          const v = Number(s[valueKey]) || 0;
          return (
            <button
              key={s.date || i}
              type="button"
              tabIndex={series.length > 120 ? -1 : 0}
              aria-label={`${date(s.date)}: ${format(v)}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
            >
              <span
                className={cx('block w-full rounded-t-sm transition-colors', v > 0 ? 'bg-gold/60 group-hover:bg-gold group-focus-visible:bg-gold' : 'bg-white/10', active === i && 'bg-gold')}
                style={{ height: v > 0 ? `${Math.max(3, (v / max) * 100)}%` : 2 }}
              />
            </button>
          );
        })}
      </div>
      <div className="relative mt-1 flex justify-between text-[10px] text-lilac" aria-hidden>
        {ticks.map((i) => (
          <span key={i}>{date(series[i].date).replace(/ \d{4}$/, '')}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        {label}: total {format(total)}, highest day {format(max)}.
      </figcaption>
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s, i) => (
            <tr key={s.date || i}>
              <td>{s.date}</td>
              <td>{format(s[valueKey])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bar list: rows [{ key, label, value, hint, to }]. */
export function BarList({ rows = [], format = money, empty = 'Nothing to show yet.', tone = 'gold' }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-lilac">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  const bar = { gold: 'bg-gold/25', violet: 'bg-amethyst-light/20', rose: 'bg-rose-500/20' }[tone] || 'bg-gold/25';
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const pct = Math.max(1.5, ((Number(r.value) || 0) / max) * 100);
        const inner = (
          <div className="relative overflow-hidden rounded-lg px-3 py-2">
            <span className={cx('absolute inset-y-0 left-0 rounded-lg', bar)} style={{ width: `${pct}%` }} aria-hidden />
            <div className="relative flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ivory">{r.label}</span>
              <span className="shrink-0 tabular-nums text-ivory">
                {format(r.value)}
                {r.hint && <span className="ml-2 text-xs text-lilac">{r.hint}</span>}
              </span>
            </div>
          </div>
        );
        return (
          <li key={r.key ?? r.label}>
            {r.to ? (
              <Link to={r.to} className="block rounded-lg hover:bg-white/[0.03]">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Small "label · value" row used in totals and summaries. */
export function SummaryRow({ label, value, strong, className }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-4 py-1 text-sm', className)}>
      <span className="text-lilac">{label}</span>
      <span className={cx('tabular-nums', strong ? 'text-base font-semibold text-ivory' : 'text-ivory')}>{value}</span>
    </div>
  );
}

/** Order line with image, quantity, price and custom-bracelet details. */
export function OrderLine({ item, compact = false }) {
  const s = item?.snapshot || {};
  const custom = item?.kind === 'custom_bracelet';
  const name = lineName(item);
  const details = custom
    ? [
        ['Intention', text(s.intention?.braceletName || s.intention?.name || s.intention)],
        ['Purpose', text(s.purpose)],
        ['Charm', text(s.charm)],
        ['Finish', text(s.finish)],
        ['Wrist size', text(s.wristSize)],
        ['Bead size', s.beadSizeMm ? `${s.beadSizeMm} mm` : ''],
        ['Thread', text(s.threadType)],
        ['Stone style', text(s.czStyle)],
        ['Engraving', text(s.engravingName)],
        ['Date of birth', text(s.dateOfBirth)],
        ['Zodiac', text(s.zodiac)],
        ['Mulank', text(s.mulank)],
        ['Bhagyank', text(s.bhagyank)],
        ['Layer', text(s.layer)],
      ].filter(([, v]) => v)
    : [];
  const beads = custom && Array.isArray(s.beads) ? s.beads : [];
  return (
    <div className="flex gap-3">
      <Thumb src={lineImage(item)} alt="" size={compact ? 40 : 56} color={s.colorHex} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="font-medium text-ivory">
              {item?.productId && !custom ? (
                <Link to={`/admin/products/${item.productId}`} className="hover:text-gold">
                  {name}
                </Link>
              ) : (
                name
              )}
            </p>
            <p className="text-xs text-lilac">
              {custom && (
                <Badge tone="accent" className="mr-2">
                  Custom bracelet
                </Badge>
              )}
              {number(item?.quantity || 1)} × {money(item?.unitPrice)}
            </p>
          </div>
          <p className="tabular-nums text-ivory">{money(item?.lineTotal ?? (Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 1))}</p>
        </div>
        {!compact && details.length > 0 && (
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            {details.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="shrink-0 text-lilac">{k}</dt>
                <dd className="min-w-0 break-words text-ivory">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {!compact && beads.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-lilac">Beads</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {beads.map((b, i) => (
                <li key={`${b.beadId || b.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-ivory">
                  <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ background: b.colorHex || 'transparent' }} aria-hidden />
                  {text(b.name) || 'Bead'} × {number(b.quantity || 1)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
