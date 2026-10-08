import mark from '../../assets/brand/mark.webp';
import wordmark from '../../assets/brand/wordmark.webp';

/**
 * The Kuberstones logo: crystal emblem with the gold wordmark. `stack` puts the wordmark under
 * the emblem (footer, loading screen); the default sets them side by side (header).
 */
export default function BrandMark({ name = 'Kuberstones', stack = false, className = '' }) {
  return (
    <span className={`nx-brand${stack ? ' is-stack' : ''}${className ? ` ${className}` : ''}`}>
      <img className="nx-brand-mark" src={mark} alt="" width="88" height="88" decoding="async" />
      {/* the wrapper carries a sheen masked to the letters (CSS --wm) */}
      <span className="nx-brand-wordw" style={{ '--wm': `url(${wordmark})` }}>
        <img className="nx-brand-word" src={wordmark} alt={name} width="640" height="63" decoding="async" />
      </span>
    </span>
  );
}
