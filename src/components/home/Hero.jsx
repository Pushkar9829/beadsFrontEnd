import { mediaUrl } from '../../api/client';
import Button from '../ui/Button';
import heroFallback from '../../assets/home/hero-bracelet.jpg';

export default function Hero({ hero = {} }) {
  const image = hero.image ? mediaUrl(hero.image) : heroFallback;
  const primary = hero.primaryCta || {};
  const secondary = hero.secondaryCta || {};

  return (
    <section className="hero-stage relative overflow-hidden">
      <div className="hero-dust" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hero-spark" style={{ '--i': i }} />
        ))}
      </div>

      <div className="shell relative grid items-center gap-6 pt-2 pb-8 sm:gap-8 sm:pt-3 sm:pb-10 md:grid-cols-2 md:pt-5 md:pb-12 lg:gap-12 lg:pt-6 lg:pb-14">
        <div className="min-w-0">
          {hero.eyebrow && (
            <p className="hero-fade hero-delay-1 hero-italic text-[10px] uppercase tracking-[0.2em] text-gold sm:text-xs sm:tracking-[0.24em]">
              {hero.eyebrow}
            </p>
          )}

          <h1 className="hero-fade hero-delay-1 hero-brand hero-italic mt-3 gold-text text-4xl tracking-wide sm:mt-4 sm:text-5xl md:text-6xl">
            {hero.brandName || 'Kuberstones'}
          </h1>

          {hero.title && (
            <h2 className="hero-fade hero-delay-copy hero-italic mt-3 text-[1.35rem] leading-[1.15] break-words gold-text sm:mt-4 sm:text-2xl md:text-4xl">
              {hero.title}
            </h2>
          )}
          {hero.subtitle && (
            <p
              className="hero-fade hero-delay-copy mt-3 max-w-lg text-sm leading-relaxed text-lilac sm:mt-4 sm:text-base"
              style={{ animationDelay: '280ms' }}
            >
              {hero.subtitle}
            </p>
          )}
          {(primary.label || secondary.label) && (
            <div
              className="hero-fade hero-delay-copy mt-7 flex w-full flex-col gap-3 min-[420px]:mt-9 min-[420px]:flex-row min-[420px]:flex-wrap"
              style={{ animationDelay: '420ms' }}
            >
              {primary.label && (
                <Button to={primary.to || '/customize'} className="w-full min-[420px]:w-auto">
                  {primary.label}
                </Button>
              )}
              {secondary.label && (
                <Button to={secondary.to || '/shop'} variant="ghost" className="w-full min-[420px]:w-auto">
                  {secondary.label}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="hero-emblem-wrap relative mx-auto w-full max-w-[18rem] sm:max-w-sm md:ml-auto md:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="hero-emblem-glow" />
          <div className="hero-emblem-ring" aria-hidden />
          <img
            src={image}
            alt={hero.imageAlt || hero.brandName || 'Kuberstones'}
            className="hero-emblem relative z-10 aspect-4/3 w-full rounded-3xl object-cover gold-border sm:rounded-4xl"
          />
        </div>
      </div>
    </section>
  );
}
