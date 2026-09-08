import { useEffect } from 'react';

export function useInViewOnce(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reveal = () => el.classList.add('is-in');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      reveal();
      return undefined;
    }

    const inRange = () => {
      const vh = window.innerHeight || 1;
      return el.getBoundingClientRect().top < vh * 0.98;
    };
    if (inRange()) {
      reveal();
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        reveal();
        io.disconnect();
      },
      { threshold: [0, 0.08, 0.2], rootMargin: '0px 0px 0px 0px' }
    );

    io.observe(el);
    const fallback = window.setTimeout(reveal, 350);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [ref]);
}
