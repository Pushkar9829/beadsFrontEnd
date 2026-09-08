import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, ShoppingBag, User } from 'lucide-react';
import logo from '../../assets/brand/logo.jpg';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import AccountDrawer from './AccountDrawer';

const families = [
  { slug: 'crystals', name: 'Crystals' },
  { slug: 'rudraksha', name: 'Rudraksha' },
  { slug: 'gemstones', name: 'Gemstones' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);
  const [accountOpen, setAccountOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const [mega, setMega] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const megaTimer = useRef(null);

  useEffect(() => {
    setMega(null);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setTree(data.tree || [])).catch(() => {});
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
        className={`sticky top-0 z-40 border-b transition-[background,box-shadow,border-color] duration-300 ${
          scrolled
            ? 'border-[rgba(198,167,94,0.32)] bg-black/92 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl'
            : 'border-[rgba(198,167,94,0.18)] bg-black/78 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src={logo}
              alt="Kuberstones"
              className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/40 transition duration-300 group-hover:ring-gold group-hover:shadow-[0_0_18px_rgba(198,167,94,0.35)]"
            />
            <div className="leading-tight">
              <div className="font-serif text-sm tracking-[0.28em] gold-text">KUBERSTONES</div>
              <div className="hidden text-[10px] uppercase tracking-[0.22em] text-lilac sm:block">
                Energy · Abundance · Wellness
              </div>
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
                    `header-nav-link flex items-center gap-1 px-3 py-2 ${isActive ? 'is-active text-gold' : 'text-ivory/80'}`
                  }
                >
                  {f.name}
                  <ChevronDown
                    size={12}
                    className={`transition duration-200 ${mega === f.slug ? 'rotate-180 text-gold' : ''}`}
                  />
                </NavLink>
                {mega === f.slug && (
                  <div className="absolute left-0 top-full w-72 pt-3">
                    <div className="animate-mega overflow-hidden rounded-2xl bg-surface/95 p-2 gold-border backdrop-blur-md">
                      {childrenOf(f.slug).length === 0 && (
                        <p className="px-3 py-2 text-sm text-lilac">Collections incoming.</p>
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
                            className="block rounded-xl px-3 py-2.5 text-sm text-ivory/80 transition hover:bg-gold/10 hover:text-gold"
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
            <NavLink
              to="/customize"
              className={({ isActive }) =>
                `ml-1 rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.16em] transition duration-200 ${
                  isActive
                    ? 'gold-btn'
                    : 'border border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                }`
              }
            >
              Customization
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `header-nav-link px-3 py-2 ${isActive ? 'is-active text-gold' : 'text-ivory/80'}`
              }
            >
              Shop All
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `header-nav-link px-3 py-2 ${isActive ? 'is-active text-gold' : 'text-ivory/80'}`
              }
            >
              About
            </NavLink>
          </nav>

          <div className="flex items-center gap-1.5">
            {user?.role === 'admin' && (
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

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2.5 lg:hidden">
          {families.map((f) => (
            <NavLink
              key={f.slug}
              to={`/${f.slug}`}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                  isActive ? 'bg-gold/15 text-gold' : 'text-ivory/75'
                }`
              }
            >
              {f.name}
            </NavLink>
          ))}
          <NavLink
            to="/customize"
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                isActive ? 'gold-btn' : 'border border-gold/40 text-gold'
              }`
            }
          >
            Customization
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                isActive ? 'bg-gold/15 text-gold' : 'text-ivory/75'
              }`
            }
          >
            Shop All
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
                isActive ? 'bg-gold/15 text-gold' : 'text-ivory/75'
              }`
            }
          >
            About
          </NavLink>
        </nav>
      </header>

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
