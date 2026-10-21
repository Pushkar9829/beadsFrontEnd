import { useSite } from '../store/contentStore';
import { fillCopy } from './homeContent';

export function useStudioLabels() {
  return useSite().pages?.customize?.labels || {};
}

export function studioText(labels, key, vars) {
  return fillCopy(labels?.[key] || '', vars);
}
