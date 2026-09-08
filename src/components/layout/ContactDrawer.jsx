import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

const empty = { name: '', email: '', phone: '', message: '' };

export default function ContactDrawer({ open, onClose, defaultEmail = '' }) {
  const [form, setForm] = useState(empty);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

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

  function submit(e) {
    e.preventDefault();
    setSent(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close contact form"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-dvh w-full max-w-md flex-col border-l border-[rgba(198,167,94,0.32)] bg-[#0d0d10] shadow-[-24px_0_60px_rgba(0,0,0,0.55)] animate-drawer-right">
        <div className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">The atelier</p>
            <h2 className="font-serif text-xl gold-text">Contact us</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-lilac transition hover:bg-gold/10 hover:text-ivory"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {sent ? (
            <div className="pt-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Received</p>
              <h3 className="mt-3 font-serif text-2xl gold-text">We have your note.</h3>
              <p className="mt-3 text-sm leading-relaxed text-lilac">
                Thank you, {form.name || 'friend'}. The house will write back to {form.email}.
              </p>
              <Button className="mt-8 w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm leading-relaxed text-lilac">
                Tell us how we may help — a piece, a custom strand, or a quiet question.
              </p>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="contact-input mt-2"
                  autoComplete="name"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="contact-input mt-2"
                  autoComplete="email"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="contact-input mt-2"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Message
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  className="contact-input mt-2 min-h-[8rem] resize-y rounded-2xl"
                />
              </label>
              <Button type="submit" className="w-full">
                Send the note
              </Button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
