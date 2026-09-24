import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { resolveStudioModes } from '../../lib/studioModes';
import { useSettingsStore } from '../../store/settingsStore';
import { useCustomizerStore } from '../../store/customizerStore';
import { ModeArt } from './OptionArt';

export default function StudioModeNav() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const fromStore = useSettingsStore((s) => s.studioModes);
  const fromCustomizer = useCustomizerStore((s) => s.config);
  const modes = resolveStudioModes(fromCustomizer?.studioModes?.length ? fromCustomizer : { studioModes: fromStore });
  const active =
    pathname === '/customize/purpose'
      ? 'purpose'
      : params.get('path') || (params.get('purpose') ? 'purpose' : 'purpose');

  return (
    <nav className="studio-mode-nav" aria-label="Customization paths">
      {modes.map((mode) => (
        <Link
          key={mode.slug}
          to={`/customize?path=${mode.slug}`}
          className={`studio-mode-chip inline-flex items-center gap-1.5 ${active === mode.slug ? 'is-on' : ''}`}
        >
          <ModeArt mode={mode} small />
          {mode.short}
        </Link>
      ))}
    </nav>
  );
}
