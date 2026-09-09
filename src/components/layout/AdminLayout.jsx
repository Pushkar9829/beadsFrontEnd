import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Gem,
  Sparkles,
  Settings,
  ShoppingBag,
  Users,
  FileText,
  Image,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/products', label: 'Products', icon: ShoppingBag },
  { to: '/admin/beads', label: 'Beads', icon: Gem },
  { to: '/admin/intentions', label: 'Purposes & mappings', icon: Sparkles },
  { to: '/admin/config', label: 'Bracelet config', icon: Settings },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/content', label: 'Site content', icon: FileText },
  { to: '/admin/media', label: 'Media', icon: Image },
];

function Sidebar({ onNavigate }) {
  return (
    <>
      <div className="border-b border-[rgba(198,167,94,0.2)] px-5 py-5">
        <div className="font-serif tracking-[0.2em] gold-text">KUBERSTONES</div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-lilac">Atelier admin</div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-amethyst/30 text-gold' : 'text-lilac hover:bg-raised hover:text-ivory'}`
            }
          >
            <l.icon size={16} /> {l.label}
          </NavLink>
        ))}
      </nav>
      <Link to="/" className="flex items-center gap-2 border-t border-[rgba(198,167,94,0.2)] px-5 py-4 text-sm text-lilac hover:text-gold">
        <ArrowLeft size={14} /> Storefront
      </Link>
    </>
  );
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-canvas text-ivory">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[rgba(198,167,94,0.2)] bg-surface md:flex">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-[rgba(198,167,94,0.2)] bg-surface">
            <button type="button" className="absolute right-3 top-4 text-lilac" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex h-screen flex-col md:ml-64">
        <header className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] bg-[#FCF8F4]/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="text-ivory md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="text-sm text-lilac">Signed in as {user?.email}</div>
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-gold">
            Store
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
