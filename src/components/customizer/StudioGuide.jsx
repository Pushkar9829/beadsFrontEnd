// Side column on the first step: the road ahead (step copy comes from the CMS, same as the
// page header) and, once chosen, the purpose itself. Replaces the empty bracelet preview,
// which has nothing to show before any crystals are picked.
import { useCustomizerStore } from '../../store/customizerStore';
import { flowFor, stepCopy } from '../../lib/studioFlow';
import { useSite } from '../../store/contentStore';
import { PurposeIcon } from './PurposeGrid';

export default function StudioGuide() {
  const path = useCustomizerStore((s) => s.path);
  const purpose = useCustomizerStore((s) => s.purpose);
  const cmsSteps = useSite().pages.customize?.steps || [];
  const flow = flowFor(path);

  return (
    <aside className="nx-guide">
      {purpose ? (
        <div className="nx-guide-pick">
          <span className="nx-guide-art" aria-hidden>
            <PurposeIcon purpose={purpose} />
          </span>
          <span>
            <span className="nx-eb">Your purpose</span>
            <span className="nx-guide-name">{purpose.name}</span>
          </span>
        </div>
      ) : null}
      <p className="nx-eb">How it works</p>
      <ol className="nx-guide-steps">
        {flow.map((entry, i) => {
          const copy = stepCopy(i + 1, cmsSteps, path);
          return (
            <li key={entry.id} className={i === 0 ? 'is-on' : ''}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <b>{entry.label}</b>
                <em>{copy.title}</em>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="nx-guide-note">Each strand is composed from your choices. The live price appears once crystals are on the strand.</p>
    </aside>
  );
}
