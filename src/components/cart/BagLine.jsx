import { Link } from 'react-router-dom';
import GemVisual from '../ui/GemVisual';
import Price from '../ui/Price';
import { itemMeta, itemTitle } from '../../lib/cartItems';

/** One bag line: picture, kind, name and details, with `children` on the left of the footer. */
export default function BagLine({ item, children, aside }) {
  const snap = item.snapshot || {};
  const title = itemTitle(item);
  const meta = itemMeta(item);
  const href = item.kind === 'product' && snap.slug ? `/p/${snap.slug}` : null;
  const kind = item.kind === 'custom_bracelet' ? 'Studio' : snap.family || 'House';
  const media = <GemVisual color={snap.colorHex || snap.beads?.[0]?.colorHex} image={snap.image} className="h-full w-full" name={title} />;

  return (
    <article className="nx-line">
      <div className="nx-line-media">{href ? <Link to={href} tabIndex={-1}>{media}</Link> : media}</div>
      <div className="nx-line-body">
        <p className="nx-k">{kind}</p>
        <h2 className="nx-line-t">{href ? <Link to={href}>{title}</Link> : title}</h2>
        {meta && <p className="nx-line-m">{meta}</p>}
        <div className="nx-line-foot">
          {children}
          <span className="nx-line-price">
            <Price value={item.lineTotal} />
            {aside}
          </span>
        </div>
      </div>
    </article>
  );
}
