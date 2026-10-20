// Create account. Source: beeds_ecommerce/src/pages/AuthPage.jsx sign-up form (lines 1305-1535). Styles: styles/atelier/auth.css.
// Not ported: the date-of-birth field (the account API stores no birth date).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell from '../components/home/nocturne/AuthShell';
import { showToast } from '../components/layout/QuickToast';

// Source strength meter (AuthPage.jsx lines 61-76).
function strength(pass) {
  if (!pass) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { score: 1, label: 'Gentle', tone: 'is-1' };
  if (score === 2) return { score: 2, label: 'Moderate', tone: 'is-2' };
  if (score === 3) return { score: 3, label: 'Sacred & Strong', tone: 'is-3' };
  return { score: 4, label: 'Impenetrable Aura', tone: 'is-4' };
}

function Field({ id, label, ...input }) {
  return (
    <div>
      <label className="auth-label is-s" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="auth-input is-s" {...input} />
    </div>
  );
}

export default function RegisterPage() {
  const page = useSite().pages.register;
  const register = useAuthStore((s) => s.register);
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const meter = strength(form.password);

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
      showToast(`Sacred initiation complete. Welcome to Kuberstones, ${payload.name}!`, 'gold');
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell page={page} wide>
      <form onSubmit={submit} className="auth-form is-signup">
        <Field id="reg-name" label="Full name *" value={form.name} onChange={set('name')} type="text" required autoComplete="name" placeholder="e.g. Maharani Gayatri / Devendra Sharma" />

        <div className="auth-two">
          <Field id="reg-email" label="Sacred email *" value={form.email} onChange={set('email')} type="email" required autoComplete="email" placeholder="name@domain.com" />
          <Field id="reg-phone" label="Phone (+91)" value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" placeholder="+91 98201 XXXXX" />
        </div>

        <div className="auth-two">
          <Field id="reg-password" label="Password *" value={form.password} onChange={set('password')} type="password" required autoComplete="new-password" placeholder="Min 8 characters" />
          <Field id="reg-confirm" label="Confirm password *" value={form.confirm} onChange={set('confirm')} type="password" required autoComplete="new-password" placeholder="Re-enter password" />
        </div>

        {form.password && (
          <div>
            <div className="auth-meter-head">
              <span>Aura Security</span>
              <span className={`auth-meter-label ${meter.tone}`}>{meter.label}</span>
            </div>
            <div className="auth-meter">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={step <= meter.score ? meter.tone : ''} />
              ))}
            </div>
          </div>
        )}

        <label className="auth-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I accept the <Link to="/terms">House Rules</Link> &amp; <Link to="/privacy">Sacred Privacy Charter</Link>.
          </span>
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="auth-submit is-signup">
          {busy ? page.submitBusy : page.submitLabel}
        </button>

        <div className="auth-foot is-signup">
          {page.footer} <Link to="/login">{page.footerLink}</Link>
        </div>
      </form>
    </AuthShell>
  );
}
