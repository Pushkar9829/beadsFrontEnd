import { Link } from 'react-router-dom';

export default function SectionHead({ eyebrow, title, body, to, action }) {
  return (
    <div className="sec-head flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="max-w-2xl min-w-0">
        {eyebrow && (
          <p className="sec-eyebrow text-[9px] uppercase tracking-[0.2em] text-gold sm:text-[10px] sm:tracking-[0.24em]">{eyebrow}</p>
        )}
        <h2 className="sec-title mt-1.5 font-serif text-xl gold-text sm:text-2xl md:text-3xl">{title}</h2>
        {body && (
          <p className="sec-body mt-2 max-w-xl text-xs leading-relaxed text-lilac md:text-sm">{body}</p>
        )}
      </div>
      {to && action && (
        <Link to={to} className="sec-action text-[10px] uppercase tracking-[0.18em] text-gold transition hover:text-gold-light">
          {action}
        </Link>
      )}
    </div>
  );
}
