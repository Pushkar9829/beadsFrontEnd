import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell, { Field } from '../components/home/nocturne/AuthShell';

export default function LoginPage() {
  const page = useSite().pages.login;
  const login = useAuthStore((s) => s.login);
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email.trim(), password);
      await onLogin();
      navigate(user.role === 'admin' && from === '/account' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell page={page}>
      <form onSubmit={submit} className="nx-form">
        <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
        <Field label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
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
        {page.footer}{' '}
        <Link to="/register" state={location.state}>
          {page.footerLink}
        </Link>
      </p>
      <p className="nx-auth-note">Demo customer demo@kuberstones.com / Demo@123</p>
    </AuthShell>
  );
}
