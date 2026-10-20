// Sign in. Source: beeds_ecommerce/src/pages/AuthPage.jsx sign-in form (lines 1028-1304). Styles: styles/atelier/auth.css.
// Not ported (no backend for them): "Forgot password?", "Remember me", Google / Apple sign-in.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell from '../components/home/nocturne/AuthShell';
import { showToast } from '../components/layout/QuickToast';

export default function LoginPage() {
  const page = useSite().pages.login;
  const login = useAuthStore((s) => s.login);
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email.trim(), password);
      await onLogin();
      showToast(`Welcome back to the Sanctuary, ${user.name || ''}`.trim(), 'gold');
      navigate(user.role === 'admin' && from === '/account' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell page={page}>
      <form onSubmit={submit} className="auth-form">
        <div>
          <label className="auth-label" htmlFor="login-email">
            Email
          </label>
          <input id="login-email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="name@kuberstones.in" />
        </div>

        <div>
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
          </div>
          <div className="auth-pass">
            <input
              id="login-password"
              className="auth-input has-eye"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
            />
            <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="auth-submit">
          {busy ? page.submitBusy : page.submitLabel}
        </button>

        <div className="auth-foot">
          {page.footer}{' '}
          <Link to="/register" state={location.state}>
            {page.footerLink}
          </Link>
        </div>

        {/* Local development only: the demo account is never created in production. */}
        {import.meta.env.DEV && (
          <button
            type="button"
            className="auth-demo"
            onClick={() => {
              setEmail('demo@kuberstones.com');
              setPassword('Demo@123');
            }}
          >
            <KeyRound size={13} /> Fill Demo Patron Credentials
          </button>
        )}
      </form>
    </AuthShell>
  );
}
