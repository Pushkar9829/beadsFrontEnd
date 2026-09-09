import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInViewOnce } from '../../lib/useInViewOnce';
import crystals from '../../assets/home/house-crystals.jpg';
import rudraksha from '../../assets/home/house-rudraksha.jpg';
import gemstones from '../../assets/home/house-gemstones.jpg';

const SLIDE = ['house-from-left', 'house-from-center', 'house-from-right'];

const HOUSE_IMAGES = {
  crystals,
  rudraksha,
  gemstones,
};

export default function HousesRow({ houses }) {
  const ref = useRef(null);
  useInViewOnce(ref);

  return (
    <div ref={ref} className="houses mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {houses.map((f, i) => (
        <div key={f.slug} className={`house-slide ${SLIDE[i] || 'house-from-center'}`}>
          <Link to={`/${f.slug}`} className="house-card group block h-full">
            {HOUSE_IMAGES[f.slug] && (
              <div className="house-card-media">
                <img src={HOUSE_IMAGES[f.slug]} alt="" />
              </div>
            )}
            <div className="house-card-body">
              <p className="font-serif text-sm tracking-[0.28em] text-gold/70">{f.roman}</p>
              <h3 className="mt-2.5 font-serif text-xl sm:mt-3 sm:text-2xl">{f.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-lilac sm:text-sm">{f.blurb}</p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-gold transition group-hover:translate-x-1">
                Enter the house →
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
