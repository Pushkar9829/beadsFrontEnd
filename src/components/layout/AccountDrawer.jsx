import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  FileText,
  Heart,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Button from '../ui/Button';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'KS';
}

export default function AccountDrawer({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const onLogout = useCartStore((s) => s.onLogout);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user) {
      setOrderCount(0);
      return undefined;
    }
    let cancelled = false;
    api
      .get('/orders/mine')
      .then(({ data }) => {
        if (!cancelled) setOrderCount((data.orders || []).length);
      })
      .catch(() => {
        if (!cancelled) setOrderCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!open || !user) return null;

  const shopTabs = [
    { to: '/cart', label: 'Cart', icon: ShoppingBag, count: cartCount },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, count: wishCount },
    { to: '/account', label: 'Orders', icon: Package, count: orderCount },
  ];

  const helpTabs = [
    { to: '/returns', label: 'Return & Exchange', icon: RefreshCw },
    { to: '/privacy', label: 'Privacy Policy', icon: Shield },
    { to: '/terms', label: 'Terms & Conditions', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close account panel"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-overlay"
        onClick={onClose}
      />
      <aside className="account-panel relative z-10 flex h-dvh w-full max-w-md flex-col border-l border-[rgba(198,167,94,0.32)] bg-[#0d0d10] shadow-[-24px_0_60px_rgba(0,0,0,0.55)] animate-drawer-right">
        <div className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Account</p>
            <h2 className="font-serif text-xl gold-text">Your atelier</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-lilac transition hover:bg-gold/10 hover:text-ivory"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-linear-to-br from-gold-light to-gold-deep font-serif text-lg text-ink ring-2 ring-gold/50 shadow-[0_0_22px_rgba(107,63,160,0.4)]">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg">{user.name}</p>
              <p className="truncate text-sm text-lilac">{user.email}</p>
            </div>
          </div>

          <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-gold">Shop</p>
          <nav className="mt-2 grid gap-1.5">
            {shopTabs.map((tab) => (
              <TabLink key={tab.to} {...tab} onClose={onClose} />
            ))}
          </nav>

          <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-gold">Help & policies</p>
          <nav className="mt-2 grid gap-1.5">
            {helpTabs.map((tab) => (
              <TabLink key={tab.to} {...tab} onClose={onClose} />
            ))}
          </nav>

          <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-gold">More</p>
          <nav className="mt-2 grid gap-1.5">
            <TabLink to="/customize" label="Customization" icon={Sparkles} onClose={onClose} />
            {user.role === 'admin' && (
              <TabLink to="/admin" label="Admin atelier" icon={Settings} onClose={onClose} />
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-[rgba(198,167,94,0.2)] px-5 py-4">
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              await logout();
              onLogout();
              onClose();
            }}
          >
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </aside>
    </div>
  );
}

function TabLink({ to, label, icon: Icon, count, onClose }) {
  const showCount = typeof count === 'number';
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl border border-gold/20 bg-surface/80 px-3 py-3 text-sm text-ivory/90 transition hover:border-gold/50 hover:bg-amethyst/15"
    >
      <Icon size={16} className="text-gold" />
      <span className="flex-1">{label}</span>
      {showCount && (
        <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold ${
          count > 0 ? 'bg-gold text-ink' : 'bg-raised text-lilac'
        }`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
      <ChevronRight size={14} className="text-lilac" />
    </Link>
  );
}
