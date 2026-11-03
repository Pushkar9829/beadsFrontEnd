// "Continue with WhatsApp" on Sign in / Create account: number -> 6-digit code from WhatsApp -> signed in.
// A number seen for the first time asks for name + email once (new account). Hidden when the server says
// WhatsApp sign-in is off or not configured. Styles: styles/atelier/auth.css ("WhatsApp sign-in").
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function WhatsAppAuth({ onDone, loginState }) {
  const setSession = useAuthStore((s) => s.setSession);
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState('closed'); // closed | phone | code | profile
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/auth/whatsapp/status')
      .then(({ data }) => alive && setEnabled(Boolean(data?.enabled)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (step !== 'code' || resendAt <= Date.now()) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step, resendAt]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  if (!enabled) return null;

  async function run(fn) {
    setBusy(true);
    setError('');
    setEmailTaken(false);
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      if (err.status === 409) setEmailTaken(true);
      if (err.response?.data?.expired && step === 'code') setCode('');
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const { data } = await api.post('/auth/whatsapp/start', { phone });
      setSentTo(data.phone);
      setDevCode(data.devCode || '');
      setCode('');
      setResendAt(Date.now() + (data.resendIn || 45) * 1000);
      setNow(Date.now());
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      const { data } = await api.post('/auth/whatsapp/verify', { phone, code });
      if (data.needsProfile) {
        setSignupToken(data.signupToken);
        setStep('profile');
        return;
      }
      setSession(data.token, data.user);
      await onDone(data.user);
    });

  const complete = () =>
    run(async () => {
      try {
        const { data } = await api.post('/auth/whatsapp/complete', { signupToken, name, email });
        setSession(data.token, data.user);
        await onDone(data.user);
      } catch (err) {
        if (err.response?.data?.expired) {
          setStep('phone');
          setSignupToken('');
        }
        throw err;
      }
    });

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  if (step === 'closed') {
    return (
      <div className="auth-wa">
        <div className="auth-or">
          <span>or</span>
        </div>
        <button type="button" className="auth-wa-btn" onClick={() => setStep('phone')}>
          <MessageCircle size={16} aria-hidden /> Continue with WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div className="auth-wa">
      <div className="auth-or">
        <span>or</span>
      </div>
      <div className="auth-wa-panel">
        <div className="auth-wa-head">
          <MessageCircle size={16} aria-hidden />
          <span>{step === 'profile' ? 'One last step' : 'Sign in with WhatsApp'}</span>
          <button type="button" className="auth-wa-close" onClick={() => setStep('closed')} aria-label="Close WhatsApp sign-in">
            ×
          </button>
        </div>

        {step === 'phone' && (
          <form
            className="auth-wa-step"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <label className="auth-label" htmlFor="wa-phone">
              WhatsApp number
            </label>
            <input id="wa-phone" className="auth-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <p className="auth-wa-hint">We send a 6-digit code to this number on WhatsApp.</p>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="auth-wa-send" disabled={busy || phone.replace(/\D/g, '').length < 10}>
              {busy ? 'Sending…' : 'Send code on WhatsApp'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form
            className="auth-wa-step"
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <p className="auth-wa-hint">
              Code sent to <strong>{sentTo}</strong> on WhatsApp.{' '}
              <button type="button" className="auth-wa-link" onClick={() => setStep('phone')}>
                Change number
              </button>
            </p>
            <label className="auth-label" htmlFor="wa-code">
              6-digit code
            </label>
            <input
              id="wa-code"
              ref={codeRef}
              className="auth-input auth-wa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
            {devCode && <p className="auth-wa-hint">Test mode code: {devCode}</p>}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="auth-wa-send" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Verify & continue'}
            </button>
            <button type="button" className="auth-wa-link" disabled={busy || wait > 0} onClick={sendCode}>
              {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form
            className="auth-wa-step"
            onSubmit={(e) => {
              e.preventDefault();
              complete();
            }}
          >
            <p className="auth-wa-hint">Number verified ({sentTo}). Tell us your name and email to create your account.</p>
            <label className="auth-label" htmlFor="wa-name">
              Full name
            </label>
            <input id="wa-name" className="auth-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <label className="auth-label" htmlFor="wa-email">
              Email
            </label>
            <input id="wa-email" className="auth-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && (
              <p className="auth-error" role="alert">
                {error}{' '}
                {emailTaken && (
                  <Link to="/login" state={loginState}>
                    Sign in with email
                  </Link>
                )}
              </p>
            )}
            <button type="submit" className="auth-wa-send" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
