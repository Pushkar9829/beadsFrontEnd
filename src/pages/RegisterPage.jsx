// Create account: full name + WhatsApp number + 6-digit code (components/auth/WhatsAppAuth.jsx). Email and
// password were removed. Layout: AuthShell (source AuthPage.jsx sign-up panel). Styles: styles/atelier/auth.css.
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell from '../components/home/nocturne/AuthShell';
import WhatsAppAuth from '../components/auth/WhatsAppAuth';
import { showToast } from '../components/layout/QuickToast';

export default function RegisterPage() {
  const page = useSite().pages.register;
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const location = useLocation();
  // Same return path as sign-in (e.g. back to the home Kundli modal); only in-app paths.
  const fromLoc = location.state?.from;
  const from = fromLoc?.pathname && fromLoc.pathname.startsWith('/') && !fromLoc.pathname.startsWith('//') ? `${fromLoc.pathname}${fromLoc.search || ''}` : '/account';

  async function finish(user) {
    await onLogin();
    showToast(`Welcome to Kuberstones, ${user.name || ''}`.trim(), 'gold');
    navigate(from, { replace: true });
  }

  return (
    <AuthShell page={page}>
      <WhatsAppAuth mode="register" onDone={finish} linkState={location.state} />
    </AuthShell>
  );
}
