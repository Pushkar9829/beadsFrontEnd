import bracelet from '../../assets/home/hero-bracelet.jpg';
import Button from '../ui/Button';

export default function Hero({ hero = {} }) {
  return (
    <section className="hero-stage relative overflow-hidden">
      <div className="hero-dust" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hero-spark" style={{ '--i': i }} />
        ))}
      </div>

      <div className="shell relative grid items-center gap-8 pt-3 pb-10 sm:gap-10 sm:pt-4 sm:pb-12 md:grid-cols-2 md:pt-6 md:pb-16 lg:gap-16 lg:pt-8 lg:pb-20">
        <div className="min-w-0">
          <p className="hero-fade hero-delay-1 hero-italic text-[11px] uppercase tracking-[0.22em] text-gold sm:text-sm sm:tracking-[0.28em]">
            {hero.eyebrow || 'Energy · Abundance · Wellness'}
          </p>

          <h1 className="hero-fade hero-delay-1 hero-brand hero-italic mt-4 gold-text text-5xl tracking-wide sm:mt-5 sm:text-6xl md:text-7xl">
            Kuberstones
          </h1>

          <h2 className="hero-fade hero-delay-copy hero-italic mt-5 text-[1.7rem] leading-[1.15] break-words gold-text sm:mt-6 sm:text-3xl md:text-5xl">
            {hero.title || 'Heal. Align. Attract abundance.'}
          </h2>
          <p
            className="hero-fade hero-delay-copy mt-4 max-w-lg text-base leading-relaxed text-lilac sm:mt-5 sm:text-lg"
            style={{ animationDelay: '280ms' }}
          >
            {hero.subtitle ||
              'Build a personal bracelet from purpose and intention — every crystal chosen with a reason.'}
          </p>
          <div
            className="hero-fade hero-delay-copy mt-7 flex w-full flex-col gap-3 min-[420px]:mt-9 min-[420px]:flex-row min-[420px]:flex-wrap"
            style={{ animationDelay: '420ms' }}
          >
            <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
            <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
          </div>
        </div>

        <div className="hero-emblem-wrap relative mx-auto w-full max-w-[18rem] sm:max-w-sm md:ml-auto md:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="hero-emblem-glow" />
          <div className="hero-emblem-ring" aria-hidden />
          <img
            src={bracelet}
            alt="Handmade crystal bracelet on the wrist"
            className="hero-emblem relative z-10 aspect-4/3 w-full rounded-3xl object-cover gold-border sm:rounded-4xl"
          />
        </div>
      </div>
    </section>
  );
}
