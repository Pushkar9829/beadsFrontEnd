import { useRef } from 'react';
import { useInViewOnce } from '../../lib/useInViewOnce';

export default function RitualSteps({ steps }) {
  const ref = useRef(null);
  useInViewOnce(ref);

  return (
    <ol ref={ref} className="ritual mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
      <span className="ritual-line" aria-hidden />
      {steps.map((step, i) => (
        <li key={step.n} className="ritual-step" style={{ '--i': i }}>
          <p className="ritual-num font-serif text-2xl text-gold">{step.n}</p>
          <h3 className="ritual-title mt-5 font-serif text-xl">{step.title}</h3>
          <p className="ritual-body mt-3 text-sm leading-relaxed text-lilac">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
