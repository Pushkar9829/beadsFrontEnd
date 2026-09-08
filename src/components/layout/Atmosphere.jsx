import { useMemo } from 'react';

const KEYS = ['atm-drift-a', 'atm-drift-b', 'atm-drift-c', 'atm-drift-d', 'atm-drift-e'];

export default function Atmosphere() {
  const clouds = useMemo(
    () =>
      KEYS.map((name, i) => ({
        name,
        className: `atm-cloud atm-${i + 1}`,
        dur: `${(6.5 + Math.random() * 7).toFixed(2)}s`,
        delay: `${(-Math.random() * 9).toFixed(2)}s`,
      })),
    [],
  );

  return (
    <div className="atm" aria-hidden>
      {clouds.map((c) => (
        <span
          key={c.name}
          className={c.className}
          style={{ '--atm-dur': c.dur, '--atm-delay': c.delay }}
        />
      ))}
    </div>
  );
}
