import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, ShoppingBag, User } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import AccountDrawer from './AccountDrawer';
import { resolveStudioModes } from '../../lib/studioModes';
import { useSettingsStore, useBrand } from '../../store/settingsStore';
import { useSite } from '../../store/contentStore';
import { isStaff } from '../../lib/staff';
import FlashSaleMark from '../ui/FlashSaleMark';
import useRefreshOnView from '../../hooks/useRefreshOnView';

const fallbackFamilies = [
  { slug: 'crystals', name: 'Crystals' },
  { slug: 'rudraksha', name: 'Rudraksha' },
  { slug: 'gemstones', name: 'Gemstones' },
];

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
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);
  const [accountOpen, setAccountOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const [collections, setCollections] = useState([]);
  const [flash, setFlash] = useState(null);
  const [mega, setMega] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const megaTimer = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    setMega(null);
    setAccountOpen(false);
  }, [location.pathname]);

  useRefreshOnView(() => {
    api.get('/categories').then(({ data }) => setTree(data.tree || [])).catch(() => {});
    api.get('/collections').then(({ data }) => setCollections(data.collections || [])).catch(() => {});
    api.get('/flash-sales/active').then(({ data }) => setFlash(data.sale || null)).catch(() => {});
  });

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setHeaderH(h);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    setAccountOpen((v) => !v);
  };

  const onCart = () => {
    if (authLoading) return;
    if (!user) {
      goLogin('/cart');
      return;
    }
    navigate('/cart');
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-40 border-b transition-[background,box-shadow,border-color] duration-300 ${
          scrolled
            ? 'border-[rgba(198,167,94,0.32)] bg-black/92 shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
            : 'border-[rgba(198,167,94,0.18)] bg-black/90'
        }`}
      >
        <div className="shell flex items-center justify-between gap-2 py-2 sm:gap-3 sm:py-2.5">
          <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gold/40 transition duration-300 group-hover:ring-gold group-hover:shadow-[0_0_18px_rgba(198,167,94,0.35)] sm:h-10 sm:w-10"
            />
            <div className="min-w-0 leading-tight">
              <div className="whitespace-nowrap font-serif text-[10px] tracking-[0.14em] gold-text sm:text-xs sm:tracking-[0.22em]">
                {brand.display}
              </div>
              {brand.tagline ? (
                <div className="hidden text-[10px] uppercase tracking-[0.22em] text-lilac sm:block">
                  {brand.tagline}
                </div>
              ) : null}
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {families.map((f) => (
              <div
                key={f.slug}
                className="relative"
                onMouseEnter={() => openMega(f.slug)}
                onMouseLeave={closeMega}
              >
                <NavLink
                  to={`/${f.slug}`}
                  className={({ isActive }) =>
                    `header-nav-link flex items-center gap-1 px-3 py-2 ${isActive ? 'is-active' : ''}`
                  }
                >
                  {f.name}
                  <ChevronDown
                    size={12}
                    className={`transition duration-200 ${mega === f.slug ? 'rotate-180' : ''}`}
                  />
                </NavLink>
                {mega === f.slug && (
                  <div className="absolute left-0 top-full w-72 pt-3">
                    <div className="animate-mega overflow-hidden rounded-2xl bg-surface/95 p-2 gold-border">
                      {childrenOf(f.slug).length === 0 && (
                        <p className="px-3 py-2 text-sm text-lilac">{site.pages?.collections?.empty?.copy || site.pages?.category?.empty?.copy || 'No collections in this house yet.'}</p>
                      )}
                      {childrenOf(f.slug).map((c) =>
                        c.slug === 'customize-your-bracelet' ? (
                          <Link
                            key={c._id}
                            to="/customize"
                            className="block rounded-xl px-3 py-2.5 text-sm text-gold transition hover:bg-gold/10"
                          >
                            {c.name}
                          </Link>
                        ) : (
                          <Link
                            key={c._id}
                            to={`/c/${c.slug}`}
                            className="header-cat-link block rounded-xl px-3 py-2.5 text-sm transition hover:bg-gold/10"
                          >
                            {c.name}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div
              className="relative ml-1"
              onMouseEnter={() => openMega('customize')}
              onMouseLeave={closeMega}
            >
              <NavLink
                to="/customize"
                className={() => {
                  const on = location.pathname.startsWith('/customize');
                  return `header-nav-link flex items-center gap-1 px-3 py-2 ${on ? 'is-active' : ''}`;
                }}
              >
                {brand.nav.customize}
                <ChevronDown
                  size={12}
                  className={`transition duration-200 ${mega === 'customize' ? 'rotate-180' : ''}`}
                />
              </NavLink>
              {mega === 'customize' && (
                <div className="absolute left-0 top-full w-80 pt-3">
                  <div className="animate-mega overflow-hidden rounded-2xl bg-surface/95 p-2 gold-border">
                    {studioModes.map((mode) => (
                      <Link
                        key={mode.slug}
                        to={mode.path}
                        className="header-cat-link block rounded-xl px-3 py-2.5 text-sm transition hover:bg-gold/10"
                      >
                        {mode.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div
              className="relative"
              onMouseEnter={() => openMega('collections')}
              onMouseLeave={closeMega}
            >
              <NavLink
                to="/collections"
                className={({ isActive }) =>
                  `header-nav-link flex items-center gap-1 px-3 py-2 ${isActive ? 'is-active' : ''}`
                }
              >
                {brand.nav.collections}
                <ChevronDown
                  size={12}
                  className={`transition duration-200 ${mega === 'collections' ? 'rotate-180' : ''}`}
                />
              </NavLink>
              {mega === 'collections' && (
                <div className="absolute left-0 top-full w-72 pt-3">
                  <div className="animate-mega overflow-hidden rounded-2xl bg-surface/95 p-2 gold-border">
                    <Link to="/collections" className="header-cat-link block rounded-xl px-3 py-2.5 text-sm transition hover:bg-gold/10">
                      All collections
                    </Link>
                    {collections.map((c) => (
                      <Link
                        key={c._id}
                        to={`/collection/${c.slug}`}
                        className="header-cat-link block rounded-xl px-3 py-2.5 text-sm transition hover:bg-gold/10"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `header-nav-link px-3 py-2 ${isActive ? 'is-active' : ''}`
              }
            >
              {brand.nav.shopAll}
            </NavLink>
            {flash && (
              <NavLink to="/sale" className="flash-nav">
                <FlashSaleMark />
              </NavLink>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            {isStaff(user) && (
              <Link
                to="/admin"
                className="hidden rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest text-amethyst-light transition hover:bg-amethyst/20 sm:inline"
              >
                Admin
              </Link>
            )}
            <IconLink to="/wishlist" label="Wishlist" count={wishCount}>
              <Heart size={18} fill={wishCount > 0 ? 'currentColor' : 'none'} />
            </IconLink>
            <button
              type="button"
              aria-label={`Cart, ${cartCount} items`}
              className="header-icon"
              onClick={onCart}
            >
              <ShoppingBag size={18} />
              <span key={cartCount} className={`header-count ${cartCount > 0 ? 'is-live' : ''}`}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </button>
            <button
              type="button"
              aria-label={user ? 'Open account' : 'Sign in'}
              aria-expanded={accountOpen}
              onClick={onProfile}
              className={`header-icon ${accountOpen ? 'is-open' : ''}`}
            >
              <User size={18} />
              {user && <span className="header-icon-dot" />}
            </button>
          </div>
        </div>

        <nav className="shell no-scrollbar flex gap-1 overflow-x-auto pb-2.5 lg:hidden">
          {families.map((f) => (
            <NavLink
              key={f.slug}
              to={`/${f.slug}`}
              className={({ isActive }) =>
                `header-cat-link shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                  isActive ? 'is-active bg-gold/15' : ''
                }`
              }
            >
              {f.name}
            </NavLink>
          ))}
          <NavLink
            to="/customize"
            className={() =>
              `header-cat-link shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                location.pathname.startsWith('/customize') ? 'is-active bg-gold/15' : ''
              }`
            }
          >
            {brand.nav.customize}
          </NavLink>
          {studioModes.map((mode) => (
            <NavLink
              key={mode.slug}
              to={mode.path}
              className={({ isActive }) =>
                `header-cat-link shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                  isActive ? 'is-active bg-gold/15' : ''
                }`
              }
            >
              {mode.short}
            </NavLink>
          ))}
          <NavLink
            to="/collections"
            className={({ isActive }) =>
              `header-cat-link shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                isActive ? 'is-active bg-gold/15' : ''
              }`
            }
          >
            {brand.nav.collections}
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `header-cat-link shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                isActive ? 'is-active bg-gold/15' : ''
              }`
            }
          >
            {brand.nav.shopAll}
          </NavLink>
          {flash && (
            <NavLink to="/sale" className="flash-nav shrink-0">
              <FlashSaleMark />
            </NavLink>
          )}
        </nav>
      </header>
      <div className="shrink-0" style={{ height: headerH }} aria-hidden />

      <AccountDrawer open={accountOpen && !!user} onClose={() => setAccountOpen(false)} />
    </>
  );
}

function IconLink({ to, label, count, children }) {
  const n = Number(count) || 0;
  return (
    <Link to={to} aria-label={`${label}, ${n} items`} className="header-icon">
      {children}
      <span key={n} className={`header-count ${n > 0 ? 'is-live' : ''}`}>
        {n > 99 ? '99+' : n}
      </span>
    </Link>
  );
}
