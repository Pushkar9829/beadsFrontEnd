import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { resolveStudioModes } from '../../lib/studioModes';
import { useSettingsStore, useBrand } from '../../store/settingsStore';
import { useSite } from '../../store/contentStore';
import { isStaff } from '../../lib/staff';
import useRefreshOnView from '../../hooks/useRefreshOnView';
import HomeHeaderBar from './HomeHeaderBar';

const fallbackFamilies = [
  { slug: 'crystals', name: 'Crystals' },
  { slug: 'rudraksha', name: 'Rudraksha' },
  { slug: 'gemstones', name: 'Gemstones' },
];

// Sticky header with the notice strip (hidden in the studio), as in the atelier design.
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const site = useSite();
  const houseItems = site.houses?.items || [];
  const brand = useBrand();
  const studioModes = resolveStudioModes({ studioModes: useSettingsStore((s) => s.studioModes) });
  const families = houseItems.length
    ? houseItems.map((h) => ({ slug: h.slug, name: h.name }))
    : fallbackFamilies;
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);
  const [tree, setTree] = useState([]);
  const [collections, setCollections] = useState([]);
  const [mega, setMega] = useState(null);
  const megaTimer = useRef(null);
  const headerRef = useRef(null);
  const inStudio = location.pathname.startsWith('/customize');
  const rawNotice = site.brand?.notice;
  const notice = inStudio ? [] : Array.isArray(rawNotice) ? rawNotice : String(rawNotice || '').split('·').map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    setMega(null);
  }, [location.pathname]);

  useRefreshOnView(() => {
    api.get('/categories').then(({ data }) => setTree(data.tree || [])).catch(() => {});
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).catch(() => {});
  });

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--header-h');
    };
  }, []);

  const childrenOf = (slug) => tree.find((n) => n.slug === slug)?.children || [];

  const openMega = (slug) => {
    clearTimeout(megaTimer.current);
    setMega(slug);
  };
  const closeMega = () => {
    megaTimer.current = setTimeout(() => setMega(null), 140);
  };

  const goLogin = (fromPath = location.pathname) => {
    navigate('/login', { state: { from: { pathname: fromPath } } });
  };

  const onProfile = () => {
    if (authLoading) return;
    if (!user) {
      goLogin(location.pathname);
      return;
    }
    navigate('/account');
  };

  const onCart = () => {
    if (authLoading) return;
    if (!user) {
      goLogin('/cart');
      return;
    }
    navigate('/cart');
  };

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header ref={headerRef} className="at-header">
      <HomeHeaderBar
        brandName={String(brand.display || brand.name || 'KUBERSTONES').toUpperCase()}
        families={families}
        childrenOf={childrenOf}
        studioModes={studioModes}
        collections={collections}
        nav={brand.nav}
        notice={notice}
        labels={site.brand || {}}
        mega={mega}
        openMega={openMega}
        closeMega={closeMega}
        emptyCopy={site.pages?.collections?.empty?.copy || site.pages?.category?.empty?.copy || 'No collections in this house yet.'}
        wishCount={wishCount}
        cartCount={cartCount}
        user={user}
        staff={isStaff(user)}
        onCart={onCart}
        onProfile={onProfile}
        onLogout={onLogout}
      />
    </header>
  );
}
