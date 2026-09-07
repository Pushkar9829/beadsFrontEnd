import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-3xl gold-text">Sign in</h1>
      <p className="mt-2 text-center text-sm text-lilac">One account for the store and the atelier admin.</p>
      <Card className="mt-8 p-6">
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs uppercase tracking-widest text-gold">Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" />
          </label>
          <label className="block text-xs uppercase tracking-widest text-gold">Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory" />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-lilac">
          New here? <Link to="/register" className="text-gold">Create an account</Link>
        </p>
        <p className="mt-4 text-center text-[11px] text-ivory/40">Demo customer demo@kuberstones.com / Demo@123</p>
      </Card>
    </div>
  );
}
