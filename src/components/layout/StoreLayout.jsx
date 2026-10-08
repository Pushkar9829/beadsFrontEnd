import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BootScreen from './BootScreen';
import { NFooter } from '../home/nocturne/Nocturne';
import '../home/nocturne/nocturne.css';
import '../home/nocturne/commerce.css';
import { useSite, useContentStore } from '../../store/contentStore';
import { useSettingsStore, useBrand } from '../../store/settingsStore';
import { useBootStore } from '../../store/bootStore';
import useRefreshOnView from '../../hooks/useRefreshOnView';

export default function StoreLayout() {
  const { pathname } = useLocation();
  const site = useSite();
  const brand = useBrand();
  const markPageReady = useBootStore((s) => s.markPageReady);
  const loadContent = useContentStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useRefreshOnView((force) => {
    loadContent(force);
    loadSettings(force);
  });

  useEffect(() => {
    loadContent();
    loadSettings();
  }, [pathname, loadContent, loadSettings]);

  // The home page reports ready once its data is in; every other page is ready on arrival.
  useEffect(() => {
    if (pathname !== '/') markPageReady();
  }, [pathname, markPageReady]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <BootScreen />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <NFooter footer={site.footer} brandName={brand.display || 'KUBERSTONES'} />
    </div>
  );
}
