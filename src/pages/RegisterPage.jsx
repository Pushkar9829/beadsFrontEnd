import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import { HOUSE_IMAGES } from '../components/home/nocturne/Nocturne';
import AuthShell, { Field } from '../components/home/nocturne/AuthShell';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { key: 'phone', label: 'Phone (optional)', type: 'tel', autoComplete: 'tel', required: false },
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
    <AuthShell page={page} image={HOUSE_IMAGES.gemstones}>
      <form onSubmit={submit} className="nx-form">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} type={field.type} required={field.required} autoComplete={field.autoComplete} />
        ))}
        {error && (
          <p className="nx-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="nx-btn nx-btn-block">
          {busy ? page.submitBusy : page.submitLabel}
        </button>
      </form>
      <p className="nx-auth-foot">
        {page.footer} <Link to="/login">{page.footerLink}</Link>
      </p>
    </AuthShell>
  );
}
