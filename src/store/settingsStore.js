import { create } from 'zustand';
import api, { mediaUrl } from '../api/client';
import fallbackLogo from '../assets/brand/logo.jpg';
import { useSite } from './contentStore';
import { setStoreCurrency } from '../lib/format';

const EMPTY = {
  storeName: 'Kuberstones',
  logo: '',
  email: '',
  phone: '',
  currency: 'INR',
  seo: { title: 'Kuberstones', description: '', keywords: '', ogImage: '', noIndex: false },
};

export const useSettingsStore = create((set, get) => ({
  store: EMPTY,
  loadedAt: 0,
  async load(force = false) {
    const now = Date.now();
    if (!force && get().loadedAt && now - get().loadedAt < 2000) return;
    try {
      const { data } = await api.get('/store');
      const store = {
        ...EMPTY,
        ...data.store,
        seo: { ...EMPTY.seo, ...data.store?.seo },
      };
      setStoreCurrency(store.currency);
      set({
        store,
        loadedAt: Date.now(),
      });
    } catch {
      /* keep previous */
    }
  },
}));

export function useStoreIdentity() {
  return useSettingsStore((s) => s.store);
}

export function useBrand() {
  const site = useSite();
  const settings = useStoreIdentity();
  const name = settings.storeName || site.hero?.brandName || 'Kuberstones';
  const display = site.brand?.name || site.footer?.brandName || name;
  const tagline = site.brand?.tagline || 'Personalized With Purpose';
  const logoPath = settings.logo || site.brand?.logo || site.footer?.logo || '';
  return {
    name,
    display,
    tagline,
    logo: logoPath ? mediaUrl(logoPath) : fallbackLogo,
    seo: settings.seo,
    nav: {
      customize: site.brand?.customizeLabel || 'Customization',
      collections: site.brand?.collectionsLabel || 'Collections',
      shopAll: site.brand?.shopAllLabel || 'Shop All',
    },
  };
}

export function pageTitle(page, brand) {
  const store = brand?.name || 'Kuberstones';
  if (!page) return brand?.seo?.title || store;
  return `${page} · ${store}`;
}
