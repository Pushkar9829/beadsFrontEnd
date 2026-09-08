import { Link } from 'react-router-dom';

export default function SectionHead({ eyebrow, title, body, to, action }) {
  return (
    <div className="sec-head flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-5">
      <div className="max-w-2xl min-w-0">
        {eyebrow && (
          <p className="sec-eyebrow text-[10px] uppercase tracking-[0.22em] text-gold sm:text-[11px] sm:tracking-[0.28em]">{eyebrow}</p>
        )}
        <h2 className="sec-title mt-2 font-serif text-2xl gold-text sm:text-3xl md:text-4xl">{title}</h2>
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
