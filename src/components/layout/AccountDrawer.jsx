import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  FileText,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import { isStaff } from '../../lib/staff';

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
    { to: '/account#addresses', label: 'Addresses', icon: MapPin, count: user.addresses?.length || 0 },
  ];

  const helpTabs = [
    { to: '/shipping', label: 'Shipping & Delivery', icon: Truck },
    { to: '/returns', label: 'Returns', icon: RefreshCw },
    { to: '/exchanges', label: 'Exchanges', icon: RefreshCw },
    { to: '/refunds', label: 'Refunds & Cancellations', icon: FileText },
    { to: '/privacy', label: 'Privacy Policy', icon: Shield },
    { to: '/terms', label: 'Terms & Conditions', icon: FileText },
    { to: '/grievance', label: 'Contact & Grievance', icon: Mail },
  ];

  const signOut = async () => {
    await logout();
    onLogout();
    onClose();
  };

  return (
    <Popup
      side
      eyebrow="Account"
      title="Your atelier"
      titleId="account-drawer-title"
      label="Close account panel"
      onClose={onClose}
      footer={
        <Button variant="ghost" size="s" onClick={signOut}>
          <LogOut size={14} strokeWidth={1.6} /> Sign out
        </Button>
      }
    >
      <div className="nx-me">
        <span className="nx-me-av">{initials(user.name)}</span>
        <div className="min-w-0">
          <p className="nx-me-n">{user.name}</p>
          <p className="nx-note">{user.email}</p>
        </div>
      </div>

      <p className="nx-k nx-tabs-k">Shop</p>
      <nav className="nx-tabs">
        {shopTabs.map((tab) => (
          <TabLink key={tab.to} {...tab} onClose={onClose} />
        ))}
      </nav>

      <p className="nx-k nx-tabs-k">Help & policies</p>
      <nav className="nx-tabs">
        {helpTabs.map((tab) => (
          <TabLink key={tab.to} {...tab} onClose={onClose} />
        ))}
      </nav>

      <p className="nx-k nx-tabs-k">More</p>
      <nav className="nx-tabs">
        <TabLink to="/customize" label="Customization" icon={Sparkles} onClose={onClose} />
        <TabLink to="/journal" label="Journal" icon={FileText} onClose={onClose} />
        <TabLink to="/faq" label="FAQ" icon={FileText} onClose={onClose} />
        {isStaff(user) && <TabLink to="/admin" label="Admin atelier" icon={Settings} onClose={onClose} />}
      </nav>
    </Popup>
  );
}

function TabLink({ to, label, icon: Icon, count, onClose }) {
  return (
    <Link to={to} onClick={onClose} className="nx-tab">
      <Icon size={16} strokeWidth={1.6} />
      <span>{label}</span>
      {typeof count === 'number' && <span className={`nx-tab-n${count > 0 ? ' is-on' : ''}`}>{count > 99 ? '99+' : count}</span>}
      <ChevronRight size={14} strokeWidth={1.6} />
    </Link>
  );
}
