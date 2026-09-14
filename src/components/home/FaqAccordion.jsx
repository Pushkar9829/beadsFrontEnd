import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import InViewGroup from '../ui/InViewGroup';

export default function FaqAccordion({ items = [] }) {
  const [openId, setOpenId] = useState(items[0]?._id ?? null);

  return (
    <InViewGroup className="faq-list mt-6 sm:mt-8">
      {items.map((f, i) => {
        const open = openId === f._id;
        const panelId = `home-faq-panel-${f._id}`;
        const btnId = `home-faq-btn-${f._id}`;
        return (
          <article
            key={f._id}
            className={`faq-item${open ? ' is-open' : ''}`}
            style={{ '--i': i }}
          >
            <button
              type="button"
              id={btnId}
              className="faq-trigger"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : f._id)}
            >
              <h3 className="faq-question gold-text">{f.question}</h3>
              <span className="faq-icon" aria-hidden>
                <ChevronDown size={18} strokeWidth={2.2} />
              </span>
            </button>
            <div
              id={panelId}
              className="faq-panel"
              role="region"
              aria-labelledby={btnId}
              inert={!open}
            >
              <div className="faq-panel-inner">
                <p className="faq-answer">{f.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </InViewGroup>
  );
}
