import logo from '../../assets/brand/logo.jpg';
import Button from '../ui/Button';
import HeroBrand, { HERO_WRITE_MS } from './HeroBrand';

export default function Hero({ hero = {} }) {
  const copyDelay = `${HERO_WRITE_MS}ms`;

  return (
    <section
      className="hero-stage relative overflow-hidden"
      style={{ '--hero-copy-delay': copyDelay }}
    >
      <div className="hero-dust" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hero-spark" style={{ '--i': i }} />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 pt-4 pb-12 md:grid-cols-2 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20">
        <div>
          <p className="hero-fade hero-delay-1 text-xs uppercase tracking-[0.32em] text-gold">
            {hero.eyebrow || 'Energy · Abundance · Wellness'}
          </p>

          <h1 className="hero-brand mt-5">
            <HeroBrand />
          </h1>

          <h2
            className="hero-fade hero-delay-copy mt-6 font-serif text-3xl leading-tight gold-text md:text-5xl"
            style={{ animationDelay: copyDelay }}
          >
            {hero.title || 'Heal. Align. Attract abundance.'}
          </h2>
          <p
            className="hero-fade hero-delay-copy mt-5 max-w-lg text-lg leading-relaxed text-lilac"
            style={{ animationDelay: `calc(${copyDelay} + 180ms)` }}
          >
            {hero.subtitle ||
              'Build a personal bracelet from purpose and intention — every crystal chosen with a reason.'}
          </p>
          <div
            className="hero-fade hero-delay-copy mt-9 flex flex-wrap gap-3"
            style={{ animationDelay: `calc(${copyDelay} + 320ms)` }}
          >
            <Button to="/customize">Customization</Button>
            <Button to="/shop" variant="ghost">Shop All</Button>
          </div>
        </div>

        <div className="hero-emblem-wrap relative mx-auto w-full max-w-md">
          <div className="hero-emblem-glow" />
          <div className="hero-emblem-ring" aria-hidden />
          <img
            src={logo}
            alt="Kuberstones emblem"
            className="hero-emblem relative z-10 w-full rounded-4xl object-cover gold-border"
          />
        </div>
      </div>
    </section>
  );
}
