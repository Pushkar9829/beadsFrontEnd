import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import { useSite } from '../../store/contentStore';
import { fillCopy } from '../../lib/homeContent';

const empty = { name: '', email: '', phone: '', message: '' };

export default function ContactDrawer({ open, onClose, defaultEmail = '' }) {
  const copy = useSite().contact;
  const [form, setForm] = useState(empty);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setSent(false);
      return;
    }
    setForm((f) => ({ ...f, email: defaultEmail || f.email }));
  }, [open, defaultEmail]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Popup side eyebrow={copy.eyebrow} title={copy.title} titleId="contact-drawer-title" label="Close contact form" onClose={onClose}>
      {sent ? (
        <div className="pt-2">
          <p className="nx-k">{copy.sentKicker}</p>
          <h3 className="nx-pop-t mt-3">{copy.sentTitle}</h3>
          <p className="nx-note mt-3">{fillCopy(copy.sentBody, { name: form.name || 'friend', email: form.email })}</p>
          <Button className="nx-btn-block mt-8" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="nx-fields">
          <p className="nx-note">{copy.body}</p>
          <label className="nx-lab">
            <span>Name</span>
            <input required className="nx-input" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
          </label>
          <label className="nx-lab">
            <span>Email</span>
            <input required type="email" className="nx-input" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
          </label>
          <label className="nx-lab">
            <span>Phone</span>
            <input type="tel" className="nx-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          </label>
          <label className="nx-lab">
            <span>Message</span>
            <textarea required rows={5} className="nx-input" value={form.message} onChange={(e) => set('message', e.target.value)} />
          </label>
          {error && <p className="nx-bad">{error}</p>}
          <Button type="submit" className="nx-btn-block" disabled={busy}>
            {copy.submitLabel}
          </Button>
        </form>
      )}
    </Popup>
  );
}
