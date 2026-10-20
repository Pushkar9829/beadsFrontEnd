// Scroll progress line, back-to-top button and the .reveal-* entrance classes used by the atelier styles.
// Ported from beeds_ecommerce/src/components/ScrollExperience.jsx (without Lenis smooth scrolling).
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const REVEAL = '.reveal-on-scroll, .reveal-fade, .reveal-scale, .reveal-left, .reveal-right, .reveal-stagger';

export default function ScrollExperience() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(limit > 0 ? Math.min(100, Math.max(0, (window.scrollY / limit) * 100)) : 0);
      setShowTop(window.scrollY > 350);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sections render after their data loads, so new reveal targets are picked up as they appear.
  useEffect(() => {
    const reveal = (el) => el.classList.add('is-revealed');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      const all = () => document.querySelectorAll(REVEAL).forEach(reveal);
      all();
      const mo = new MutationObserver(all);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );
    const seen = new WeakSet();
    const scan = () => {
      document.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el) || el.classList.contains('is-revealed')) return;
        seen.add(el);
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) reveal(el);
        else io.observe(el);
      });
    };
    const timer = setTimeout(scan, 50);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <div className="scroll-progress-bar" style={{ width: `${progress}%` }} aria-hidden="true" />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`back-to-top-btn ${showTop ? 'visible' : ''}`}
        aria-label="Scroll back to top"
        title="Ascend to Top"
      >
        <ArrowUp size={16} strokeWidth={1.75} />
      </button>
    </>
  );
}
