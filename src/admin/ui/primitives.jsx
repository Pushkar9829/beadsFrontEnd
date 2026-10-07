import { forwardRef } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const BUTTON_VARIANTS = {
  primary: 'bg-gold text-ink hover:bg-gold-light shadow-[0_0_0_1px_rgba(198,167,94,0.4)] font-medium',
  secondary: 'bg-white/[0.06] text-ivory hover:bg-white/[0.1] border border-white/10',
  ghost: 'text-lilac hover:text-ivory hover:bg-white/[0.06]',
  danger: 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 border border-rose-400/30',
  link: 'text-gold hover:text-gold-light underline-offset-4 hover:underline px-0',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        variant !== 'link' && BUTTON_SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" /> : Icon ? <Icon size={size === 'sm' ? 13 : 15} /> : null}
      {children}
      {IconRight && !loading ? <IconRight size={size === 'sm' ? 13 : 15} /> : null}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', className, ...rest }, ref) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-40',
        BUTTON_VARIANTS[variant],
        dim,
        className
      )}
      {...rest}
    >
      <Icon size={size === 'sm' ? 14 : 16} />
    </button>
  );
});

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cx('animate-spin text-gold', className)} aria-label="Loading" />;
}

const TONES = {
  neutral: 'bg-white/[0.07] text-lilac ring-white/10',
  info: 'bg-sky-400/10 text-sky-200 ring-sky-300/20',
  success: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/25',
  warning: 'bg-amber-400/10 text-amber-200 ring-amber-300/25',
  danger: 'bg-rose-500/10 text-rose-200 ring-rose-300/25',
  accent: 'bg-amethyst-light/10 text-amethyst-light ring-amethyst-light/25',
  gold: 'bg-gold/10 text-gold ring-gold/30',
};

export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONES[tone] || TONES.neutral, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** <StatusBadge meta={ORDER_STATUS_META} value={order.status} /> */
export function StatusBadge({ meta, value }) {
  const m = (meta && meta[value]) || { label: value ? String(value).replace(/_/g, ' ') : '—', tone: 'neutral' };
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function Card({ className, children, padded = true, ...rest }) {
  return (
    <div className={cx('rounded-2xl border border-white/[0.08] bg-surface', padded && 'p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cx('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ivory">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-lilac">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-md bg-white/[0.06]', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[0.05] text-gold">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-ivory">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-lilac">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  const message = error?.message || 'Could not load this data.';
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-rose-500/10 text-rose-300">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm font-medium text-ivory">Something went wrong</p>
      <p className="mt-1 max-w-sm text-xs text-lilac">{message}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Kbd({ children }) {
  return <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] text-lilac">{children}</kbd>;
}

export function Divider({ className }) {
  return <div className={cx('h-px bg-white/[0.08]', className)} />;
}

export function Avatar({ name, src, size = 32 }) {
  const initials = String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return src ? (
    <img src={src} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-amethyst/40 font-medium text-ivory"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

/** Small product/bead thumbnail with graceful fallback. */
export function Thumb({ src, alt = '', size = 40, color }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className="shrink-0 rounded-lg border border-white/10 bg-raised object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="shrink-0 rounded-lg border border-white/10" style={{ width: size, height: size, background: color || 'rgba(255,255,255,0.05)' }} />
  );
}
