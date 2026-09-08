import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            {i > 0 && (
              <span className="crumbs-sep" aria-hidden>
                /
              </span>
            )}
            {item.to ? (
              <Link to={item.to} className="crumbs-link text-gold">
                {item.label}
              </Link>
            ) : (
              <span className="crumbs-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
