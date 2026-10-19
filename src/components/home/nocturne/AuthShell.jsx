// Split sign-in / register layout, as in beeds_ecommerce/src/pages/AuthPage.jsx: the atelier photo with
// the brand line on the left, the form panel on the right (styles/atelier/auth.css).
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import authHero from '../../../assets/home/auth-hero.jpg';

export default function AuthShell({ page, image = authHero, wide = false, children }) {
  return (
    <div className="nx nx-page auth-split-layout">
      <div className="auth-split-image-panel">
        <img className="auth-hero-img" src={page.image ? mediaUrl(page.image) : image} alt="" />
        <div className="auth-vignette" />
        <div className="auth-split-edge-fade" />

        <div className="auth-art-top">
          <div className="auth-badge">
            <Sparkles size={12} /> {page.badge || 'Kuberstones atelier'}
          </div>
        </div>

        <div className="auth-art-copy">
          {page.eyebrow && <span className="auth-eyebrow">{page.eyebrow}</span>}
          <h1 className="auth-art-title">{page.title}</h1>
          {page.body && <p className="auth-art-body">{page.body}</p>}
          {page.to && page.action && (
            <Link to={page.to} className="auth-switch">
              {page.action}
            </Link>
          )}
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-glow" />
        <div className={`auth-form-wrap${wide ? ' is-wide' : ''}`}>
          <div className="auth-form-head">
            {page.cardKicker && <span className="auth-eyebrow">{page.cardKicker}</span>}
          </div>
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
