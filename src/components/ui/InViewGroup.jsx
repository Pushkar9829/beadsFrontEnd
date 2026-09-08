import { useRef } from 'react';
import { useInViewOnce } from '../../lib/useInViewOnce';

export default function InViewGroup({ children, className = '' }) {
  const ref = useRef(null);
  useInViewOnce(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
