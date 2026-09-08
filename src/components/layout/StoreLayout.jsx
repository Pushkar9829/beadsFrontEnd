import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Atmosphere from './Atmosphere';

export default function StoreLayout() {
  const { pathname } = useLocation();
  const showAtmosphere = pathname === '/';

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-ivory">
      {showAtmosphere && <Atmosphere />}
      <div className="relative z-[1] flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
