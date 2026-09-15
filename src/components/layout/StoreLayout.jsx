import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Atmosphere from './Atmosphere';
import { paintGoldShine } from '../../lib/paintGoldShine';
import { useCustomizerStore } from '../../store/customizerStore';
import { useContentStore } from '../../store/contentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { purposeToneStyle } from '../customizer/PurposeGrid';
import useRefreshOnView from '../../hooks/useRefreshOnView';

export default function StoreLayout() {
  const { pathname } = useLocation();
  const loadContent = useContentStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);
  const purpose = useCustomizerStore((s) => s.purpose);
  const step = useCustomizerStore((s) => s.step);
  const purposeTone =
    pathname === '/customize' && purpose && step > 1
      ? purposeToneStyle(purpose)
      : undefined;

  useRefreshOnView((force) => {
    loadContent(force);
    loadSettings(force);
  });

  useEffect(() => {
    loadContent();
    loadSettings();
  }, [pathname, loadContent, loadSettings]);

  useEffect(() => {
    paintGoldShine();
    const mo = new MutationObserver(() => paintGoldShine());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname]);

  return (
    <div className="store-canvas relative flex min-h-screen flex-col text-ivory">
      <Atmosphere />
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
