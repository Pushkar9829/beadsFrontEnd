import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Sign in' },
];

export default function LoginPage() {
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
      const user = await login(email, password);
      await onLogin();
      navigate(user.role === 'admin' && from === '/account' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-10 sm:py-12 md:py-16">
        <Breadcrumbs items={CRUMBS} />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <SectionHead
            eyebrow="The atelier"
            title="Sign in"
            body="One account for the store and the atelier. Your bag and wishlist travel with you."
            to="/register"
            action="Create account →"
          />

          <article className="auth-card">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Welcome back</p>
            <h2 className="mt-2 font-serif text-2xl gold-text">Enter the house.</h2>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  className="contact-input mt-2"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                Password
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                  className="contact-input mt-2"
                />
              </label>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-5 text-sm text-lilac">
              New here?{' '}
              <Link to="/register" className="text-gold">
                Create an account
              </Link>
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-ivory/40">
              Demo customer demo@kuberstones.com / Demo@123
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
