import { useEffect, useRef } from 'react';

const LETTERS = [
  {
    ch: 'K',
    dur: 180,
    d: 'M 16 12 L 16 108 M 16 60 L 58 14 M 16 60 L 58 108',
  },
  {
    ch: 'U',
    dur: 170,
    d: 'M 14 12 L 14 72 C 14 104 56 104 56 72 L 56 12',
  },
  {
    ch: 'B',
    dur: 220,
    d: 'M 15 12 L 15 108 M 15 12 L 36 12 C 54 12 56 42 36 58 L 15 58 M 36 58 C 58 62 56 108 36 108 L 15 108',
  },
  {
    ch: 'E',
    dur: 170,
    d: 'M 15 12 L 15 108 M 15 12 L 56 12 M 15 60 L 48 60 M 15 108 L 56 108',
  },
  {
    ch: 'R',
    dur: 200,
    d: 'M 15 12 L 15 108 M 15 12 L 38 12 C 56 12 56 56 34 60 L 15 60 M 32 60 L 56 108',
  },
  {
    ch: 'S',
    dur: 210,
    d: 'M 52 26 C 48 8 12 10 14 34 C 16 52 54 56 52 80 C 50 104 12 102 16 86',
  },
  {
    ch: 'T',
    dur: 130,
    d: 'M 6 14 L 64 14 M 35 14 L 35 108',
  },
  {
    ch: 'O',
    dur: 180,
    d: 'M 35 12 C 58 12 60 108 35 108 C 10 108 12 12 35 12',
  },
  {
    ch: 'N',
    dur: 170,
    d: 'M 14 108 L 14 12 L 56 108 L 56 12',
  },
  {
    ch: 'E',
    dur: 170,
    d: 'M 15 12 L 15 108 M 15 12 L 56 12 M 15 60 L 48 60 M 15 108 L 56 108',
  },
  {
    ch: 'S',
    dur: 210,
    d: 'M 52 26 C 48 8 12 10 14 34 C 16 52 54 56 52 80 C 50 104 12 102 16 86',
  },
];

const GAP = 70;
const PAUSE = 16;

export const HERO_WRITE_MS =
  LETTERS.reduce((sum, letter) => sum + letter.dur + PAUSE, 0) + 80;

function ease(t) {
  return 1 - (1 - t) ** 3;
}

export default function HeroBrand({ onDone }) {
  const pathRefs = useRef([]);
  const penRefs = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paths = pathRefs.current;
    const pens = penRefs.current;

    if (reduce) {
      paths.forEach((path) => {
        if (!path) return;
        path.style.strokeDasharray = '1';
        path.style.strokeDashoffset = '0';
      });
      pens.forEach((pen) => {
        if (pen) pen.setAttribute('opacity', '0');
      });
      onDone?.();
      return undefined;
    }

    let cancelled = false;
    let frame = 0;

    function draw(path, pen, duration) {
      const length = 1;
      path.style.strokeDasharray = '1';
      path.style.strokeDashoffset = '1';
      if (pen) {
        const startPt = path.getPointAtLength(0);
        pen.setAttribute('cx', String(startPt.x));
        pen.setAttribute('cy', String(startPt.y));
        pen.setAttribute('opacity', '1');
      }

      return new Promise((resolve) => {
        const start = performance.now();
        const tick = (now) => {
          if (cancelled) return;
          const progress = Math.min(1, (now - start) / duration);
          const eased = ease(progress);
          path.style.strokeDashoffset = String(1 - eased);
          if (pen) {
            const pt = path.getPointAtLength(length * eased);
            pen.setAttribute('cx', String(pt.x));
            pen.setAttribute('cy', String(pt.y));
            pen.setAttribute('opacity', progress > 0.94 ? String((1 - progress) / 0.06) : '1');
          }
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
          } else {
            path.style.strokeDashoffset = '0';
            if (pen) pen.setAttribute('opacity', '0');
            resolve();
          }
        };
        frame = requestAnimationFrame(tick);
      });
    }

    (async () => {
      for (let i = 0; i < LETTERS.length; i += 1) {
        if (cancelled) return;
        const path = paths[i];
        const pen = pens[i];
        if (path) await draw(path, pen, LETTERS[i].dur);
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, PAUSE));
      }
      if (!cancelled) onDone?.();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [onDone]);

  return (
    <svg
      className="hero-brand-svg"
      viewBox={`0 0 ${LETTERS.length * GAP} 120`}
      role="img"
      aria-label="Kuberstones"
    >
      <defs>
        <radialGradient id="heroGoldStroke" gradientUnits="userSpaceOnUse" cx="380" cy="60" r="420">
          <stop offset="0%" stopColor="#e4c98a" />
          <stop offset="38%" stopColor="#c6a75e" />
          <stop offset="72%" stopColor="#a67c3a" />
          <stop offset="100%" stopColor="#8c6a2f" />
          <animate attributeName="cx" values="120;640;120" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="28;90;28" dur="11s" repeatCount="indefinite" />
          <animate attributeName="r" values="360;480;360" dur="8s" repeatCount="indefinite" />
        </radialGradient>
        <filter id="heroPenGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {LETTERS.map((letter, i) => (
        <g key={`${letter.ch}-${i}`} transform={`translate(${i * GAP} 0)`}>
          <path
            ref={(node) => {
              pathRefs.current[i] = node;
            }}
            d={letter.d}
            pathLength={1}
            className="hero-draw-stroke"
          />
          <circle
            ref={(node) => {
              penRefs.current[i] = node;
            }}
            r="4.2"
            className="hero-pen"
            opacity="0"
            filter="url(#heroPenGlow)"
          />
        </g>
      ))}
    </svg>
  );
}
