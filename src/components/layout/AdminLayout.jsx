import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
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
  Package,
  Warehouse,
  Ticket,
  Percent,
  BarChart3,
  Star,
  ShoppingCart,
  SlidersHorizontal,
  Bell,
  Zap,
  ChevronDown,
  CreditCard,
  Truck,
  Webhook,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AdminToast from '../admin/AdminToast';
import api from '../../api/client';

const groups = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Catalog',
    icon: Layers,
    items: [
      { to: '/admin/categories', label: 'Categories', icon: Layers },
      { to: '/admin/products', label: 'Products', icon: ShoppingBag },
      { to: '/admin/beads', label: 'Beads', icon: Gem },
      { to: '/admin/collections', label: 'Collections', icon: Package },
      { to: '/admin/attributes', label: 'Attributes', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Inventory',
    icon: Warehouse,
    items: [
      { to: '/admin/inventory', label: 'Stock', icon: Warehouse, end: true },
      { to: '/admin/inventory/low', label: 'Low stock', icon: Warehouse },
      { to: '/admin/inventory/history', label: 'History', icon: Warehouse },
    ],
  },
  {
    label: 'Orders',
    icon: ShoppingBag,
    items: [
      { to: '/admin/orders', label: 'All orders', icon: ShoppingBag, end: true },
      { to: '/admin/orders/pending_payment', label: 'Pending' },
      { to: '/admin/orders/processing', label: 'Processing' },
      { to: '/admin/orders/shipped', label: 'Shipped' },
      { to: '/admin/orders/delivered', label: 'Delivered' },
      { to: '/admin/orders/cancelled', label: 'Cancelled' },
      { to: '/admin/returns', label: 'Returns / refunds' },
    ],
  },
  {
    label: 'Marketing',
    icon: Ticket,
    items: [
      { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { to: '/admin/offers', label: 'Offers', icon: Percent },
      { to: '/admin/flash-sales', label: 'Flash sale', icon: Zap },
      { to: '/admin/banners', label: 'Banners', icon: Image },
      { to: '/admin/featured', label: 'Featured', icon: Star },
      { to: '/admin/abandoned-carts', label: 'Abandoned carts', icon: ShoppingCart },
    ],
  },
  {
    label: 'Customers',
    icon: Users,
    items: [
      { to: '/admin/customers', label: 'All customers', icon: Users },
      { to: '/admin/groups', label: 'Customer groups' },
    ],
  },
  {
    label: 'Bracelet builder',
    icon: Sparkles,
    items: [
      { to: '/admin/config', label: 'Config', icon: SlidersHorizontal },
      { to: '/admin/intentions', label: 'Bead rules & purposes', icon: Sparkles },
    ],
  },
  {
    label: 'Content',
    icon: FileText,
    items: [
      { to: '/admin/home-layout', label: 'Homepage', icon: FileText },
      { to: '/admin/content', label: 'Site CMS', icon: FileText },
      { to: '/admin/faqs', label: 'FAQs' },
      { to: '/admin/blog', label: 'Journal' },
      { to: '/admin/newsletter', label: 'Newsletter' },
      { to: '/admin/contacts', label: 'Contact inbox' },
      { to: '/admin/media', label: 'Media', icon: Image },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { to: '/admin/settings', label: 'General', icon: Settings, settingsTab: 'general' },
      { to: '/admin/settings?tab=payment', label: 'Payment', icon: CreditCard, settingsTab: 'payment' },
      { to: '/admin/settings?tab=shipping', label: 'Shipping / iThink', icon: Truck, settingsTab: 'shipping' },
      { to: '/admin/shipping', label: 'Pincodes', icon: Truck },
      { to: '/admin/settings?tab=webhooks', label: 'Webhooks', icon: Webhook, settingsTab: 'webhooks' },
      { to: '/admin/users', label: 'Admin users', icon: Users },
    ],
  },
];

function settingsTabFrom(search) {
  return new URLSearchParams(search).get('tab') || 'general';
}

function itemActive(item, location) {
  if (item.settingsTab) {
    return location.pathname === '/admin/settings' && settingsTabFrom(location.search) === item.settingsTab;
  }
  if (item.end) return location.pathname === item.to;
  return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
}

function groupActive(group, location) {
  return group.items.some((item) => itemActive(item, location));
}

function Sidebar({ onNavigate }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    const initial = {};
    for (const g of groups) initial[g.label] = groupActive(g, location);
    return initial;
  });

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (groupActive(g, location)) next[g.label] = true;
      }
      return next;
    });
  }, [location.pathname, location.search]);

  return (
    <>
      <div className="border-b border-[rgba(198,167,94,0.2)] px-5 py-5">
        <div className="font-serif tracking-[0.2em] gold-text">KUBERSTONES</div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-lilac">Atelier admin</div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {groups.map((g) => {
          const expanded = Boolean(open[g.label]);
          const current = groupActive(g, location);
          return (
            <div key={g.label}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen((prev) => ({ ...prev, [g.label]: !prev[g.label] }))}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
                  current ? 'bg-gold/10 text-gold' : 'text-gold/70 hover:bg-raised hover:text-gold'
                }`}
              >
                {g.icon ? <g.icon size={14} className="shrink-0" /> : null}
                <span className="flex-1 text-left">{g.label}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  className={`shrink-0 text-gold transition duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
              {expanded && (
                <div className="mt-0.5 space-y-0.5">
                  {g.items.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.end}
                      onClick={onNavigate}
                      className={() =>
                        `flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
                          itemActive(l, location) ? 'bg-amethyst/30 text-gold' : 'text-lilac hover:bg-raised hover:text-ivory'
                        }`
                      }
                    >
                      {l.icon ? <l.icon size={14} /> : <span className="w-3.5" />} {l.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/admin/notifications?unread=true&limit=1').then(({ data }) => setUnread(data.unread || 0)).catch(() => {});
  }, []);

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
        <header className="flex shrink-0 items-center justify-between border-b border-[rgba(198,167,94,0.2)] bg-black/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="text-ivory md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="text-sm text-lilac">Signed in as {user?.email}</div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/notifications" className="relative text-gold">
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] text-black">{unread}</span>
              )}
            </Link>
            <Link to="/" className="text-xs uppercase tracking-widest text-gold">
              Store
            </Link>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <AdminToast />
    </div>
  );
}
