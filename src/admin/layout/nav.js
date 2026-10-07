import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  CreditCard,
  FileText,
  FolderTree,
  Gem,
  HelpCircle,
  Home,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  Percent,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
  Ticket,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Warehouse,
  Zap,
} from 'lucide-react';

/**
 * Single source of truth for admin navigation, the command palette and page titles.
 * `adminOnly` items are hidden for manager/staff (the API refuses them anyway).
 */
export const NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/admin/returns', label: 'Returns & refunds', icon: RotateCcw },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/groups', label: 'Customer groups', icon: UsersRound },
      { to: '/admin/abandoned-carts', label: 'Abandoned carts', icon: ShoppingCart },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/collections', label: 'Collections', icon: Boxes },
      { to: '/admin/attributes', label: 'Attributes', icon: Tags },
      { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    ],
  },
  {
    label: 'Bracelet studio',
    items: [
      { to: '/admin/beads', label: 'Beads & charms', icon: Gem },
      { to: '/admin/intentions', label: 'Purposes & intentions', icon: Sparkles },
      { to: '/admin/studio-layers', label: 'Layer catalogs', icon: Layers },
      { to: '/admin/config', label: 'Studio pricing & rules', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { to: '/admin/offers', label: 'Offers', icon: Percent },
      { to: '/admin/flash-sales', label: 'Flash sales', icon: Zap },
      { to: '/admin/banners', label: 'Banners', icon: Megaphone },
      { to: '/admin/featured', label: 'Featured products', icon: Star },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/home-layout', label: 'Homepage', icon: Home },
      { to: '/admin/content', label: 'Site pages', icon: FileText },
      { to: '/admin/blog', label: 'Journal', icon: BookOpen },
      { to: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
      { to: '/admin/media', label: 'Media library', icon: Image },
      { to: '/admin/contacts', label: 'Contact inbox', icon: Inbox },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Store settings', icon: Settings, adminOnly: true },
      { to: '/admin/settings?tab=payment', label: 'Payments', icon: CreditCard, adminOnly: true, hiddenInNav: true },
      { to: '/admin/shipping', label: 'Shipping & pincodes', icon: Truck },
      { to: '/admin/users', label: 'Team & users', icon: UserCog },
    ],
  },
];

/** Quick actions offered by the command palette. */
export const QUICK_ACTIONS = [
  { to: '/admin/products?new=1', label: 'New product', icon: Package },
  { to: '/admin/coupons?new=1', label: 'New coupon', icon: Ticket },
  { to: '/admin/orders?status=processing', label: 'Orders to fulfil', icon: ShoppingBag },
  { to: '/admin/inventory?stock=low', label: 'Low stock', icon: Warehouse },
  { to: '/admin/returns?status=requested', label: 'Pending returns', icon: RotateCcw },
];

export function navForRole(isAdmin) {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => isAdmin || !i.adminOnly) })).filter((g) => g.items.length);
}

export function flatNav(isAdmin) {
  return navForRole(isAdmin).flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
}

export function isActive(item, location) {
  const [path] = item.to.split('?');
  if (item.end) return location.pathname === path;
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
}
