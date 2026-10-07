import { useSite } from '../store/contentStore';
import { fillCopy } from './homeContent';

export function useStudioLabels() {
  return useSite().pages?.customize?.labels || {};
}

export function studioText(labels, key, vars) {
  return fillCopy(labels?.[key] || '', vars);
}

function tint(color, percent) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

// Admin-picked card colours for a purpose, intention or layer item. Returns null when
// neither is set so the caller keeps its keyword-matched tone.
export function customCardTone(item) {
  const bg = item?.cardBg;
  const accent = item?.cardAccent;
  if (!bg && !accent) return null;
  const vars = {};
  if (bg) vars['--purpose-bg'] = bg;
  if (accent) {
    vars['--purpose-wash'] = tint(accent, 38);
    vars['--purpose-border'] = tint(accent, 55);
    vars['--purpose-glow'] = tint(accent, 28);
    vars['--purpose-well'] = tint(accent, 20);
  }
  return vars;
}
