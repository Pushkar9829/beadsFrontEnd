import { useRef } from 'react';
import { useInViewOnce } from '../../lib/useInViewOnce';

export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div', variant = 'up' }) {
  const ref = useRef(null);
  useInViewOnce(ref);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
