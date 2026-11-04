// Sign in: WhatsApp number + 6-digit code (components/auth/WhatsAppAuth.jsx). Email and password were
// removed; a number seen for the first time creates an account after asking for a name.
// Layout: AuthShell (source AuthPage.jsx sign-in panel). Styles: styles/atelier/auth.css.
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useSite } from '../store/contentStore';
import AuthShell from '../components/home/nocturne/AuthShell';
import WhatsAppAuth from '../components/auth/WhatsAppAuth';
import { showToast } from '../components/layout/QuickToast';

export default function LoginPage() {
  const page = useSite().pages.login;
  const onLogin = useCartStore((s) => s.onLogin);
  const navigate = useNavigate();
  const location = useLocation();
  // Return path (pathname + query, e.g. "/?kundli=1" from the home Kundli modal); only in-app paths.
  const fromLoc = location.state?.from;
  const fromPath = fromLoc?.pathname && fromLoc.pathname.startsWith('/') && !fromLoc.pathname.startsWith('//') ? `${fromLoc.pathname}${fromLoc.search || ''}` : '';
  const from = fromPath || '/account';

  async function finish(user) {
    await onLogin();
    showToast(`Welcome back to the Sanctuary, ${user.name || ''}`.trim(), 'gold');
    const staff = ['admin', 'manager', 'staff'].includes(user.role);
    navigate(staff && from === '/account' ? '/admin' : from, { replace: true });
  }

  return (
    <AuthShell page={page}>
      <WhatsAppAuth mode="login" onDone={finish} linkState={location.state} />
    </AuthShell>
  );
}
