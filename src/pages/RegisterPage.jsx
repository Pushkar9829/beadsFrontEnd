import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import { useSite } from '../store/contentStore';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Create account' },
];

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', required: false },
  { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', required: true },
];

export default function RegisterPage() {
  const page = useSite().pages.register;
  const register = useAuthStore((s) => s.register);
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      await onLogin();
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={page.body}
            to={page.to}
            action={page.action}
          />

          <article className="auth-card">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{page.cardKicker}</p>
            <h2 className="mt-2 font-serif text-2xl gold-text">{page.cardTitle}</h2>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {FIELDS.map((field) => (
                <label key={field.key} className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                  {field.label}
                  <input
                    value={form[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                    type={field.type}
                    required={field.required}
                    autoComplete={field.autoComplete}
                    className="contact-input mt-2"
                  />
                </label>
              ))}
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? page.submitBusy : page.submitLabel}
              </Button>
            </form>
            <p className="mt-5 text-sm text-lilac">
              {page.footer}{' '}
              <Link to="/login" className="text-gold">
                {page.footerLink}
              </Link>
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
