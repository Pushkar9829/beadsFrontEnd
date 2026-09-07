import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function RegisterPage() {
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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-3xl gold-text">Create account</h1>
      <Card className="mt-8 p-6">
        <form onSubmit={submit} className="space-y-4">
          {['name', 'email', 'phone', 'password'].map((k) => (
            <label key={k} className="block text-xs uppercase tracking-widest text-gold">
              {k}
              <input
                value={form[k]}
                onChange={(e) => set(k, e.target.value)}
                type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
                required={k !== 'phone'}
                className="mt-1 w-full rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
              />
            </label>
          ))}
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating…' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-lilac">
          Already with us? <Link to="/login" className="text-gold">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
