import { formatInr } from '../../lib/format';

export default function Price({ value, className = '' }) {
  return <span className={`tabular-nums ${className}`}>{formatInr(value)}</span>;
}
