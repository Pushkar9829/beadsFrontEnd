import { Link } from 'react-router-dom';

export default function SectionHead({ eyebrow, title, body, to, action }) {
  return (
    <div className="sec-head flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="sec-eyebrow text-[11px] uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
        )}
        <h2 className="sec-title mt-2 font-serif text-3xl gold-text md:text-4xl">{title}</h2>
        {body && (
          <p className="sec-body mt-3 max-w-xl text-sm leading-relaxed text-lilac md:text-base">{body}</p>
        )}
      </div>
      {to && action && (
        <Link to={to} className="sec-action text-xs uppercase tracking-[0.2em] text-gold transition hover:text-gold-light">
          {action}
        </Link>
      )}
    </div>
  );
}
