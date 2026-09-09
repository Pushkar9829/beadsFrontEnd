import { useEffect, useRef, useState } from 'react';
import GemVisual from '../ui/GemVisual';

const DEMO_KEY = 'kuber-strand-demo';

export default function StrandReorder({ layout = [], onMove, hint }) {
  const [from, setFrom] = useState(null);
  const [demo, setDemo] = useState(false);
  const fromRef = useRef(null);

  useEffect(() => {
    if (!layout.length) return undefined;
    try {
      if (sessionStorage.getItem(DEMO_KEY)) return undefined;
    } catch {
      /* ignore */
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        sessionStorage.setItem(DEMO_KEY, '1');
      } catch {
        /* ignore */
      }
      return undefined;
    }
    setDemo(true);
    const t = window.setTimeout(() => stopDemo(), 5200);
    return () => window.clearTimeout(t);
  }, [layout.length]);

  function stopDemo() {
    setDemo(false);
    try {
      sessionStorage.setItem(DEMO_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  function indexFromPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    const btn = el?.closest?.('.studio-birth-bead');
    if (!btn) return null;
    const index = Number(btn.dataset.index);
    return Number.isInteger(index) ? index : null;
  }

  function end() {
    fromRef.current = null;
    setFrom(null);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  }

  function start(index, event) {
    stopDemo();
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    fromRef.current = index;
    setFrom(index);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function moveTo(index) {
    const origin = fromRef.current;
    if (origin == null || index == null || origin === index) return;
    onMove(origin, index);
    fromRef.current = index;
    setFrom(index);
  }

  if (!layout.length) return null;

  return (
    <div>
      <p className="studio-birth-note">
        {demo ? 'Watch — then drag a bead to swap places.' : hint || 'Drag a bead to rearrange the strand.'}
      </p>
      <div className={`studio-birth-strand-wrap ${demo ? 'is-demo' : ''}`}>
        {demo && (
          <div className="strand-demo" aria-hidden>
            <span className="strand-demo-ring" />
            <span className="strand-demo-ghost" />
            <span className="strand-demo-hand">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                <path
                  d="M8 11.5V7.2a1.4 1.4 0 0 1 2.8 0V11M10.8 10.2V6.6a1.4 1.4 0 1 1 2.8 0V11M13.6 10.4V8.2a1.4 1.4 0 1 1 2.8 0V12.4c0 2.7-1.6 5.2-4.5 6.1-2 .6-4.1.2-5.5-1.1L5.2 15.4A1.6 1.6 0 0 1 6.4 12.6L8 13.2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        )}
        <div
          className="studio-birth-strand"
          onPointerMove={(e) => {
            if (fromRef.current == null) return;
            moveTo(indexFromPoint(e.clientX, e.clientY));
          }}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {layout.map((slot, index) => (
            <button
              key={`${slot.beadId || slot._id || slot.name}-${index}`}
              type="button"
              data-index={index}
              className={`studio-birth-bead is-drag ${from === index ? 'is-dragging' : ''} ${demo && index < 2 ? 'is-demo-target' : ''}`}
              title={`${slot.position}. ${slot.name}`}
              onPointerDown={(e) => start(index, e)}
              onPointerMove={(e) => {
                if (fromRef.current == null) return;
                moveTo(indexFromPoint(e.clientX, e.clientY));
              }}
              onPointerUp={end}
              onPointerCancel={end}
            >
              <GemVisual
                color={slot.colorHex}
                image={slot.image}
                name={slot.name}
                className="studio-birth-gem"
              />
              <span>{slot.position}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
