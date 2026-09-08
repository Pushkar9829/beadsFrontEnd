import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, User, X, ChevronDown } from 'lucide-react';
import logo from '../../assets/brand/logo.jpg';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import Button from '../ui/Button';

const families = [
  { slug: 'crystals', name: 'Crystals' },
  { slug: 'rudraksha', name: 'Rudraksha' },
  { slug: 'gemstones', name: 'Gemstones' },
];

export default function Header() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const [mega, setMega] = useState(null);

  useEffect(() => {
    setOpen(false);
    setMega(null);
  }, [location.pathname]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setTree(data.tree || [])).catch(() => {});
  }, []);

  const childrenOf = (slug) => tree.find((n) => n.slug === slug)?.children || [];

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(198,167,94,0.22)] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Kuberstones" className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/40" />
          <div className="leading-tight">
            <div className="font-serif text-sm tracking-[0.28em] gold-text">KUBERSTONES</div>
            <div className="hidden text-[10px] uppercase tracking-[0.22em] text-lilac sm:block">
              Energy · Abundance · Wellness
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {families.map((f) => (
            <div
              key={f.slug}
              className="relative"
              onMouseEnter={() => setMega(f.slug)}
              onMouseLeave={() => setMega(null)}
            >
              <NavLink
                to={`/${f.slug}`}
                className={({ isActive }) =>
                  `flex items-center gap-1 text-xs uppercase tracking-[0.18em] ${isActive ? 'text-gold' : 'text-ivory/80 hover:text-gold'}`
                }
              >
                {f.name} <ChevronDown size={12} />
              </NavLink>
              {mega === f.slug && (
                <div className="absolute left-0 top-full w-64 pt-3">
                  <div className="rounded-2xl bg-surface p-4 gold-border">
                    {childrenOf(f.slug).length === 0 && (
                      <p className="text-sm text-lilac">Collections incoming.</p>
                    )}
                    {childrenOf(f.slug).map((c) =>
                      c.slug === 'customize-your-bracelet' ? (
                        <Link key={c._id} to="/customize" className="block py-1.5 text-sm text-gold hover:text-gold-light">
                          {c.name}
                        </Link>
                      ) : (
                        <Link key={c._id} to={`/c/${c.slug}`} className="block py-1.5 text-sm text-ivory/80 hover:text-gold">
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
              `text-xs uppercase tracking-[0.18em] ${isActive ? 'text-gold' : 'text-gold hover:text-gold-light'}`
            }
          >
            Shop by Purpose
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `text-xs uppercase tracking-[0.18em] ${isActive ? 'text-gold' : 'text-ivory/80 hover:text-gold'}`}>
            Shop All
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `text-xs uppercase tracking-[0.18em] ${isActive ? 'text-gold' : 'text-ivory/80 hover:text-gold'}`}>
            About
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <Link to="/admin" className="hidden text-xs uppercase tracking-widest text-amethyst-light sm:inline">
              Admin
            </Link>
          )}
          <Link to={user ? '/account' : '/login'} className="text-ivory/80 hover:text-gold">
            <User size={18} />
          </Link>
          <Link to="/cart" className="relative text-ivory/80 hover:text-gold">
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] text-ink">
                {count}
              </span>
            )}
          </Link>
          <button className="lg:hidden text-ivory" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[rgba(198,167,94,0.2)] bg-black px-4 py-4 lg:hidden">
          {families.map((f) => (
            <div key={f.slug} className="py-2">
              <Link to={`/${f.slug}`} className="text-sm uppercase tracking-widest text-gold">{f.name}</Link>
              <div className="mt-1 pl-3">
                {childrenOf(f.slug).map((c) => (
                  <Link
                    key={c._id}
                    to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`}
                    className="block py-1 text-sm text-lilac"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link to="/customize" className="block py-2 text-sm uppercase tracking-widest text-gold">Shop by Purpose</Link>
          <Link to="/shop" className="block py-2 text-sm uppercase tracking-widest">Shop All</Link>
          <Link to="/about" className="block py-2 text-sm uppercase tracking-widest">About</Link>
          <Button to="/customize" className="mt-3 w-full">Shop by Purpose</Button>
        </div>
      )}
    </header>
  );
}
