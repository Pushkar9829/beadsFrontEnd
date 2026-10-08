import { Link } from 'react-router-dom';

// Nocturne button. `ghost` is the outlined style; `size="s"` is the compact height.
export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'solid',
  size,
  className = '',
  disabled,
}) {
  const cls = ['nx-btn', variant === 'ghost' && 'nx-btn-o', size === 's' && 'nx-btn-s', className].filter(Boolean).join(' ');
  if (to) return <Link to={to} onClick={onClick} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
