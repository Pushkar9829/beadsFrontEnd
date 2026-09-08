import { useEffect } from 'react';

export function useInViewOnce(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('is-in');
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const vh = window.innerHeight || 1;
        const top = entry.boundingClientRect.top;
        if (top < vh * 0.88) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: [0, 0.08, 0.2, 0.35], rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
