import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Card, Skeleton, cx } from './primitives';

/** Top of every admin screen. */
export function PageHeader({ title, description, actions, back, meta, className }) {
  return (
    <div className={cx('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-xs text-lilac hover:text-gold">
            <ArrowLeft size={13} /> {back.label || 'Back'}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate font-serif text-xl tracking-wide text-ivory sm:text-2xl">{title}</h1>
          {meta}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-lilac">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Underline tabs. items: [{ value, label, count?, hidden? }] */
export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cx('mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.08]', className)} role="tablist">
      {items
        .filter((t) => !t.hidden)
        .map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cx(
              '-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors',
              value === t.value ? 'border-gold text-ivory' : 'border-transparent text-lilac hover:text-ivory'
            )}
          >
            {t.icon && <t.icon size={14} />}
            {t.label}
            {t.count != null && <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px] tabular-nums text-lilac">{t.count}</span>}
          </button>
        ))}
    </div>
  );
}

/** KPI tile. delta: number (percent) shows a trend arrow. */
export function Stat({ label, value, hint, icon: Icon, delta, loading, to, tone = 'gold' }) {
  const toneCls = { gold: 'bg-gold/10 text-gold', violet: 'bg-amethyst-light/10 text-amethyst-light', green: 'bg-emerald-400/10 text-emerald-300', rose: 'bg-rose-500/10 text-rose-300', sky: 'bg-sky-400/10 text-sky-300' }[tone];
  const body = (
    <Card className={cx('h-full', to && 'transition-colors hover:border-gold/30')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-lilac">{label}</p>
        {Icon && (
          <span className={cx('grid h-8 w-8 place-items-center rounded-lg', toneCls)}>
            <Icon size={15} />
          </span>
        )}
      </div>
      {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 text-2xl font-semibold tabular-nums text-ivory">{value}</p>}
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && Number.isFinite(delta) && (
          <span className={cx('inline-flex items-center gap-0.5', delta >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-lilac/80">{hint}</span>}
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Label/value pairs. items: [{ label, value, full? }] */
export function DescriptionList({ items, cols = 2, className }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-3', cols === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2', className)}>
      {items
        .filter(Boolean)
        .map((it) => (
          <div key={it.label} className={cx('min-w-0', it.full && 'sm:col-span-2')}>
            <dt className="text-[11px] uppercase tracking-wider text-lilac">{it.label}</dt>
            <dd className="mt-0.5 break-words text-sm text-ivory">{it.value ?? '—'}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Vertical activity timeline. items: [{ status, note, at }] */
export function Timeline({ items = [], render }) {
  if (!items.length) return <p className="text-sm text-lilac">No activity yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-white/10 pl-4">
      {items.map((it, i) => (
        <li key={it._id || i} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-gold" />
          {render ? render(it) : <p className="text-sm text-ivory">{it.note || it.status}</p>}
        </li>
      ))}
    </ol>
  );
}
