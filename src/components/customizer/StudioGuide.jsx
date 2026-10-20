// "HOW IT WORKS" card beside step 1 (beeds_ecommerce StudioBuilderPage.jsx L1979-2059).
// Step labels and titles come from the flow and the CMS, same as the page header.
import { useCustomizerStore } from '../../store/customizerStore';
import { flowFor, stepCopy } from '../../lib/studioFlow';
import { useSite } from '../../store/contentStore';

export default function StudioGuide() {
  const path = useCustomizerStore((s) => s.path);
  const cmsSteps = useSite().pages.customize?.steps || [];
  const flow = flowFor(path);

  return (
    <aside className="sb-panel sb-how">
      <div className="sb-k">How it works</div>
      <ol className="sb-how-list">
        {flow.map((entry, i) => {
          const copy = stepCopy(i + 1, cmsSteps, path);
          return (
            <li key={entry.id} className={i === 0 ? 'is-on' : ''}>
              <div className="sb-how-k">
                {String(i + 1).padStart(2, '0')} {entry.label}
              </div>
              <div className="sb-how-t">{copy.title}</div>
            </li>
          );
        })}
      </ol>
      <div className="sb-how-note">Each strand is composed from your choices. The live price appears once crystals are on the strand.</div>
    </aside>
  );
}
