// "BEGIN BY" pills (beeds_ecommerce StudioBuilderPage.jsx L409-448). Shown on the first step of
// every path and on the shop-by-purpose page.
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { resolveStudioModes } from '../../lib/studioModes';
import { useSettingsStore } from '../../store/settingsStore';
import { useCustomizerStore } from '../../store/customizerStore';

export default function StudioPaths() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const fromStore = useSettingsStore((s) => s.studioModes);
  const fromCustomizer = useCustomizerStore((s) => s.config);
  const modes = resolveStudioModes(fromCustomizer?.studioModes?.length ? fromCustomizer : { studioModes: fromStore });
  const active = pathname === '/customize/purpose' ? 'purpose' : params.get('path') || 'purpose';
  if (modes.length < 2) return null;

  return (
    <nav className="sb-begin" aria-label="Ways to begin">
      <span className="sb-begin-l">Begin by</span>
      {modes.map((mode) => (
        <Link
          key={mode.slug}
          to={`/customize?path=${mode.slug}`}
          className={`sb-pill${active === mode.slug ? ' is-on' : ''}`}
          aria-current={active === mode.slug ? 'page' : undefined}
        >
          {mode.short}
        </Link>
      ))}
    </nav>
  );
}
