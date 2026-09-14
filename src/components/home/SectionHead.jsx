import { Link } from 'react-router-dom';

export default function SectionHead({ eyebrow, title, body, to, action, aside }) {
  return (
    <div className="sec-head flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="max-w-4xl min-w-0">
        {typeof eyebrow === 'string' ? (
          <p className="sec-eyebrow text-[9px] uppercase tracking-[0.2em] text-gold sm:text-[10px] sm:tracking-[0.24em]">{eyebrow}</p>
        ) : eyebrow ? (
          <div className="sec-eyebrow">{eyebrow}</div>
        ) : null}
        <div className="sec-title-row">
          <h2 className="sec-title font-serif text-xl gold-text sm:text-2xl md:text-3xl">{title}</h2>
          {aside}
        </div>
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
