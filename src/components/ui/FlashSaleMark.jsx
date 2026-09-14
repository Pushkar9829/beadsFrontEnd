import { Zap } from 'lucide-react';

export default function FlashSaleMark({
  label = 'Sale',
  name,
  size = 'sm',
  className = '',
}) {
  const text = name ? `${label} · ${name}` : label;
  const icon = size === 'lg' ? 15 : size === 'md' ? 13 : 11;

  return (
    <span className={`flash-mark flash-mark-${size} ${className}`.trim()}>
      <Zap className="flash-mark-bolt" size={icon} fill="currentColor" strokeWidth={0} aria-hidden />
      <span className="flash-mark-text gold-text">{text}</span>
    </span>
  );
}
