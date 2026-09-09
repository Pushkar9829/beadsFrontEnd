import { Link } from 'react-router-dom';

export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'gold',
  className = '',
  disabled,
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.14em] transition disabled:opacity-50 disabled:pointer-events-none';
  const styles = {
    gold: 'gold-btn',
    ghost:
      'border border-[rgba(198,167,94,0.4)] text-gold-light hover:bg-[rgba(198,167,94,0.08)] hover:border-amethyst-light',
    violet:
      'bg-amethyst text-ivory hover:bg-amethyst-deep border border-amethyst-light/30',
    text: 'text-lilac hover:text-ivory px-2',
  };
  const cls = `${base} ${styles[variant] || styles.gold} ${className}`;
  const label = variant === 'gold' ? <span className="gold-cloud">{children}</span> : children;
  if (to) return <Link to={to} onClick={onClick} className={cls}>{label}</Link>;
  if (href) return <a href={href} className={cls}>{label}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {label}
    </button>
  );
}
