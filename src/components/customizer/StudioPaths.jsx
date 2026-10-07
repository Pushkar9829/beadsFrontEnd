// The five ways into the studio, as a quiet tab row. Shown on the first step of every path
// and on the shop-by-purpose page.
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
    <nav className="nx-paths" aria-label="Ways to begin">
      <span className="nx-paths-l">Begin by</span>
      {modes.map((mode) => (
        <Link key={mode.slug} to={`/customize?path=${mode.slug}`} className={active === mode.slug ? 'is-on' : ''} aria-current={active === mode.slug ? 'page' : undefined}>
          {mode.short}
        </Link>
      ))}
    </nav>
  );
}
