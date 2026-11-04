// The only way to sign in or create an account: name (new accounts) + WhatsApp number + 6-digit code.
//  - mode "register": name + number -> code -> account created with that name.
//  - mode "login":    number -> code -> signed in; a number seen for the first time asks for a name once.
// Email and password are no longer used. Styles: styles/atelier/auth.css ("WhatsApp sign-in").
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function WhatsAppAuth({ mode = 'login', onDone, linkState }) {
  const setSession = useAuthStore((s) => s.setSession);
  const isRegister = mode === 'register';
  const [status, setStatus] = useState('loading'); // loading | on | off
  const [step, setStep] = useState('phone'); // phone | code | profile
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [name, setName] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/auth/whatsapp/status')
      .then(({ data }) => alive && setStatus(data?.enabled ? 'on' : 'off'))
      .catch(() => alive && setStatus('off'));
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

  if (status === 'loading') return <p className="auth-wa-hint">Loading…</p>;
  if (status === 'off') {
    return (
      <p className="auth-error" role="alert">
        Sign-in is temporarily unavailable. Please try again in a few minutes.
      </p>
    );
  }

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      if (err.response?.data?.expired && step === 'code') setCode('');
    } finally {
      setBusy(false);
    }
  }

  const finish = async (data) => {
    setSession(data.token, data.user);
    await onDone(data.user);
  };

  const createAccount = async (token, fullName) => {
    try {
      const { data } = await api.post('/auth/whatsapp/complete', { signupToken: token, name: fullName });
      await finish(data);
    } catch (err) {
      if (err.response?.data?.expired) {
        setStep('phone');
        setSignupToken('');
      }
      throw err;
    }
  };

  const sendCode = () =>
    run(async () => {
      if (isRegister && name.trim().length < 2) throw new Error('Please enter your full name.');
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
      if (!data.needsProfile) return finish(data);
      // New number: on Create account the name is already known; on Sign in ask for it once.
      if (isRegister && name.trim().length >= 2) return createAccount(data.signupToken, name.trim());
      setSignupToken(data.signupToken);
      setStep('profile');
      return undefined;
    });

  const complete = () =>
    run(async () => {
      if (name.trim().length < 2) throw new Error('Please enter your full name.');
      await createAccount(signupToken, name.trim());
    });

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const errorBox = error && (
    <p className="auth-error" role="alert">
      {error}
    </p>
  );

  return (
    <div className="auth-wa is-standalone">
      <div className="auth-wa-head">
        <MessageCircle size={16} aria-hidden />
        <span>{step === 'profile' ? 'One last step' : isRegister ? 'Create your account with WhatsApp' : 'Sign in with WhatsApp'}</span>
      </div>

      {step === 'phone' && (
        <form
          className="auth-wa-step"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          {isRegister && (
            <>
              <label className="auth-label" htmlFor="wa-name">
                Full name
              </label>
              <input id="wa-name" className="auth-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </>
          )}
          <label className="auth-label" htmlFor="wa-phone">
            WhatsApp number
          </label>
          <input id="wa-phone" className="auth-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <p className="auth-wa-hint">We send a 6-digit code to this number on WhatsApp.</p>
          {errorBox}
          <button type="submit" className="auth-wa-send" disabled={busy || phone.replace(/\D/g, '').length < 10 || (isRegister && name.trim().length < 2)}>
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
          {errorBox}
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
          <p className="auth-wa-hint">Number verified ({sentTo}). What should we call you?</p>
          <label className="auth-label" htmlFor="wa-name2">
            Full name
          </label>
          <input id="wa-name2" className="auth-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          {errorBox}
          <button type="submit" className="auth-wa-send" disabled={busy || name.trim().length < 2}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

      <p className="auth-foot">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link to={isRegister ? '/login' : '/register'} state={linkState}>
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
