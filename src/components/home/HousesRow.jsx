import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInViewOnce } from '../../lib/useInViewOnce';

const SLIDE = ['house-from-left', 'house-from-center', 'house-from-right'];

export default function HousesRow({ houses }) {
  const ref = useRef(null);
  useInViewOnce(ref);

  return (
    <div ref={ref} className="houses mt-10 grid gap-4 md:grid-cols-3">
      {houses.map((f, i) => (
        <div key={f.slug} className={`house-slide ${SLIDE[i] || 'house-from-center'}`}>
          <Link to={`/${f.slug}`} className="house-card group block h-full">
            <p className="font-serif text-sm tracking-[0.28em] text-gold/70">{f.roman}</p>
            <h3 className="mt-6 font-serif text-3xl">{f.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-lilac">{f.blurb}</p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold transition group-hover:translate-x-1">
              Enter the house →
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
