import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Nocturne popup rendered into <body> so no page stacking layer can trap it under the header.
 * `side` turns it into a right-hand drawer. Escape and the scrim close it; page scroll is locked.
 * `as="form"` makes the panel itself the form (props in `formProps`).
 */
export default function Popup({ eyebrow, title, titleId, onClose, side = false, footer, children, as: Panel = 'div', formProps, label = 'Close' }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className={`nx-layer${side ? ' is-side' : ''}`}>
      <button type="button" className="nx-scrim" aria-label={label} onClick={onClose} />
      <Panel className={side ? 'nx-drawer' : 'nx-modal'} role="dialog" aria-modal="true" aria-labelledby={titleId} {...formProps}>
        <div className="nx-pop-head">
          <div className="min-w-0">
            {eyebrow && <p className="nx-k">{eyebrow}</p>}
            <h2 id={titleId} className="nx-pop-t">
              {title}
            </h2>
          </div>
          <button type="button" className="nx-x" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>
        <div className="nx-pop-body">{children}</div>
        {footer && <div className="nx-pop-foot">{footer}</div>}
      </Panel>
    </div>,
    document.body
  );
}
