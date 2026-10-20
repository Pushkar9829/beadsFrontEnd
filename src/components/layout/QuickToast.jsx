// Bottom-right confirmation toast, from beeds_ecommerce/src/components/QuickToast.jsx (styles: atelier/tokens.css).
// Anything on the storefront can raise one with showToast(message, 'gold' | 'muted').
import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const EVENT = 'kuberstones:toast';

export function showToast(message, type = 'gold') {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }));
}

export default function QuickToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timer;
    const onToast = (e) => {
      clearTimeout(timer);
      setToast({ ...e.detail, id: Date.now() });
      timer = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(EVENT, onToast);
    };
  }, []);

  if (!toast) return null;

  return (
    <div key={toast.id} className="quick-toast" role="status" aria-live="polite">
      <div className="quick-toast-icon">{toast.type === 'muted' ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}</div>
      <p className="quick-toast-msg">{toast.message}</p>
    </div>
  );
}
