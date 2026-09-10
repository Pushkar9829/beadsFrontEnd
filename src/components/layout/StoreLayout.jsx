import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Atmosphere from './Atmosphere';
import { paintGoldShine } from '../../lib/paintGoldShine';
import { useCustomizerStore } from '../../store/customizerStore';
import { purposeToneStyle } from '../customizer/PurposeGrid';

export default function StoreLayout() {
  const { pathname } = useLocation();
  const purpose = useCustomizerStore((s) => s.purpose);
  const step = useCustomizerStore((s) => s.step);
  const purposeTone =
    pathname === '/customize' && purpose && step > 1
      ? purposeToneStyle(purpose)
      : undefined;
  const showAtmosphere =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname === '/wishlist' ||
    pathname === '/cart' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/crystals' ||
    pathname === '/rudraksha' ||
    pathname === '/gemstones' ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/p/') ||
    pathname === '/about' ||
    pathname === '/customize' ||
    pathname === '/account' ||
    pathname === '/returns' ||
    pathname === '/privacy' ||
    pathname === '/terms';

  useEffect(() => {
    paintGoldShine();
    const mo = new MutationObserver(() => paintGoldShine());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname]);

  return (
    <div className="store-canvas relative flex min-h-screen flex-col text-ivory">
      {showAtmosphere && <Atmosphere />}
      <div className="relative z-[1] flex min-h-screen flex-col">
        <Header />
        <main
          className={`flex-1${purposeTone ? ' has-purpose-tone' : ''}`}
          style={purposeTone}
        >
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
