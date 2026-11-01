import { toast } from '../../lib/adminToast';

/**
 * Copies text and says so. Uses the Clipboard API, then the textarea + execCommand fallback (http pages,
 * older browsers, blocked permission); shows an error toast only when both fail.
 */
export async function copyText(text, label = 'Copied to clipboard.') {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      ta.remove();
    } catch {
      ok = false;
    }
  }
  if (ok) toast(label);
  else toast('Could not copy. Select the text and copy it manually.', 'error');
  return ok;
}
