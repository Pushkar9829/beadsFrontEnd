import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../../api/client';
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
      {houses.map((f, i) => {
        const image = f.image ? mediaUrl(f.image) : HOUSE_IMAGES[f.slug];
        return (
          <div key={f.slug || f.name || i} className={`house-slide ${SLIDE[i] || 'house-from-center'}`}>
            <Link to={`/${f.slug}`} className="house-card group block h-full">
              {image && (
                <div className="house-card-media">
                  <img src={image} alt="" />
                </div>
              )}
              <div className="house-card-body">
                {f.roman && (
                  <p className="font-serif text-sm tracking-[0.28em] text-gold/70">{f.roman}</p>
                )}
                <h3 className="mt-2.5 font-serif text-xl sm:mt-3 sm:text-2xl">{f.name}</h3>
                {f.blurb && (
                  <p className="mt-2 text-xs leading-relaxed text-lilac sm:text-sm">{f.blurb}</p>
                )}
                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-gold transition group-hover:translate-x-1">
                  {f.cta || 'Enter the house →'}
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
