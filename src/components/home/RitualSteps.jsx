import { useRef } from 'react';
import { useInViewOnce } from '../../lib/useInViewOnce';

export default function RitualSteps({ steps }) {
  const ref = useRef(null);
  useInViewOnce(ref);

  return (
    <ol ref={ref} className="ritual mt-8 grid gap-6 sm:grid-cols-2 sm:gap-6 lg:mt-10 lg:grid-cols-4">
      <span className="ritual-line" aria-hidden />
      {steps.map((step, i) => (
        <li key={step.n || step.title || i} className="ritual-step" style={{ '--i': i }}>
          <p className="ritual-num font-serif text-xl text-gold">{step.n}</p>
          <h3 className="ritual-title mt-3 font-serif text-lg">{step.title}</h3>
          <p className="ritual-body mt-2 text-xs leading-relaxed text-lilac">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
