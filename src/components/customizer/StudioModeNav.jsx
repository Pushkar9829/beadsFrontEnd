import { NavLink } from 'react-router-dom';
import { STUDIO_MODES } from '../../lib/studioModes';

export default function StudioModeNav() {
  return (
    <nav className="studio-mode-nav" aria-label="Customization paths">
      {STUDIO_MODES.map((mode) => (
        <NavLink
          key={mode.slug}
          to={mode.path}
          className={({ isActive }) => `studio-mode-chip ${isActive ? 'is-on' : ''}`}
        >
          {mode.short}
        </NavLink>
      ))}
    </nav>
  );
}
