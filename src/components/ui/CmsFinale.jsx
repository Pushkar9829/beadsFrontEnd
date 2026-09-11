import Button from '../ui/Button';
import InViewGroup from '../ui/InViewGroup';

export default function CmsFinale({ block, className = 'mt-10' }) {
  if (!block?.title) return null;
  return (
    <InViewGroup className={`finale-stage ${className}`}>
      <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
        {block.kicker && (
          <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">{block.kicker}</p>
        )}
        <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">{block.title}</h2>
        {block.copy && (
          <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">{block.copy}</p>
        )}
        {(block.primaryCta?.label || block.secondaryCta?.label) && (
          <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            {block.primaryCta?.label && (
              <Button to={block.primaryCta.to || '/'} className="w-full min-[420px]:w-auto">
                {block.primaryCta.label}
              </Button>
            )}
            {block.secondaryCta?.label && (
              <Button to={block.secondaryCta.to || '/'} variant="ghost" className="w-full min-[420px]:w-auto">
                {block.secondaryCta.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </InViewGroup>
  );
}
