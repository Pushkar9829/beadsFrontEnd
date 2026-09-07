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
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.16em] transition disabled:opacity-50 disabled:pointer-events-none';
  const styles = {
    gold: 'gold-btn',
    ghost:
      'border border-[rgba(198,167,94,0.4)] text-gold-light hover:bg-[rgba(198,167,94,0.08)] hover:border-amethyst-light',
    violet:
      'bg-amethyst text-ivory hover:bg-amethyst-deep border border-amethyst-light/30',
    text: 'text-lilac hover:text-ivory px-2',
  };
  const cls = `${base} ${styles[variant] || styles.gold} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
