// Split sign-in / register layout: photo with the brand line on one side, the form on the other.
import { Link } from 'react-router-dom';
import { HOUSE_IMAGES } from './Nocturne';

export default function AuthShell({ page, image = HOUSE_IMAGES.crystals, children }) {
  return (
    <div className="nx nx-page nx-auth">
      <div className="nx-auth-art">
        <img src={image} alt="" />
        <div className="nx-auth-art-c">
          {page.eyebrow && <p className="nx-eb">{page.eyebrow}</p>}
          <h1 className="nx-d nx-auth-t">{page.title}</h1>
          {page.body && <p className="nx-lede">{page.body}</p>}
          {page.to && page.action && (
            <Link to={page.to} className="nx-lnk nx-mt">
              {page.action}
            </Link>
          )}
        </div>
      </div>
      <div className="nx-auth-form">
        <div className="nx-auth-card">
          {page.cardKicker && <p className="nx-eb">{page.cardKicker}</p>}
          {page.cardTitle && <h2 className="nx-d nx-auth-h">{page.cardTitle}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, ...input }) {
  return (
    <label className="nx-field">
      <span>{label}</span>
      <input {...input} />
    </label>
  );
}
