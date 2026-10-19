import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell, { Field } from '../components/home/nocturne/AuthShell';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true, placeholder: 'e.g. Maharani Gayatri / Devendra Sharma' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true, placeholder: 'name@domain.com' },
  { key: 'phone', label: 'Phone (optional)', type: 'tel', autoComplete: 'tel', required: false, placeholder: '+91 98201 XXXXX' },
  { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', required: true, placeholder: 'Min 8 characters' },
  // Confirm password and the terms box are checked here only (as in the source form).
  { key: 'confirm', label: 'Confirm password', type: 'password', autoComplete: 'new-password', required: true, placeholder: 'Re-enter password' },
];

export default function RegisterPage() {
  const page = useSite().pages.register;
  const register = useAuthStore((s) => s.register);
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the terms and the privacy policy.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { confirm: _confirm, ...payload } = form;
      await register(payload);
      await onLogin();
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell page={page} wide>
      <form onSubmit={submit} className="nx-form">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} type={field.type} required={field.required} autoComplete={field.autoComplete} placeholder={field.placeholder} />
        ))}
        <label className="nx-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            {page.termsLabel || 'I accept the'} <Link to="/terms">Terms</Link> &amp; <Link to="/privacy">Privacy Policy</Link>
          </span>
        </label>
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
