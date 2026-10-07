import { lazy } from 'react';
import { Navigate, Route, useParams } from 'react-router-dom';
import AdminShell from './layout/AdminShell';
import { RequireAdmin } from '../components/gates';
import { ORDER_STATUSES } from './lib/status';

const page = (load) => lazy(load);

const Dashboard = page(() => import('./pages/Dashboard'));
const Analytics = page(() => import('./pages/Analytics'));
const Notifications = page(() => import('./pages/Notifications'));
const Orders = page(() => import('./pages/Orders'));
const OrderDetail = page(() => import('./pages/OrderDetail'));
const Returns = page(() => import('./pages/Returns'));
const Customers = page(() => import('./pages/Customers'));
const CustomerDetail = page(() => import('./pages/CustomerDetail'));
const Groups = page(() => import('./pages/Groups'));
const AbandonedCarts = page(() => import('./pages/AbandonedCarts'));
const Products = page(() => import('./pages/Products'));
const ProductEditor = page(() => import('./pages/ProductEditor'));
const Categories = page(() => import('./pages/Categories'));
const Collections = page(() => import('./pages/Collections'));
const Attributes = page(() => import('./pages/Attributes'));
const Inventory = page(() => import('./pages/Inventory'));
const Beads = page(() => import('./pages/Beads'));
const Intentions = page(() => import('./pages/Intentions'));
const StudioLayers = page(() => import('./pages/StudioLayers'));
const StudioConfig = page(() => import('./pages/StudioConfig'));
const Coupons = page(() => import('./pages/Coupons'));
const Offers = page(() => import('./pages/Offers'));
const FlashSales = page(() => import('./pages/FlashSales'));
const Banners = page(() => import('./pages/Banners'));
const Featured = page(() => import('./pages/Featured'));
const Newsletter = page(() => import('./pages/Newsletter'));
const HomeLayout = page(() => import('./pages/HomeLayout'));
const SitePages = page(() => import('./pages/SitePages'));
const Blog = page(() => import('./pages/Blog'));
const Faqs = page(() => import('./pages/Faqs'));
const Media = page(() => import('./pages/Media'));
const Contacts = page(() => import('./pages/Contacts'));
const Settings = page(() => import('./pages/Settings'));
const Shipping = page(() => import('./pages/Shipping'));
const Users = page(() => import('./pages/Users'));

/** /admin/orders/:id — also accepts legacy /admin/orders/<status> links. */
function OrderRoute() {
  const { id } = useParams();
  if (ORDER_STATUSES.includes(id)) return <Navigate to={`/admin/orders?status=${id}`} replace />;
  return <OrderDetail />;
}

export const adminRoutes = (
  <Route
    path="/admin"
    element={
      <RequireAdmin>
        <AdminShell />
      </RequireAdmin>
    }
  >
    <Route index element={<Dashboard />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="notifications" element={<Notifications />} />

    <Route path="orders" element={<Orders />} />
    <Route path="orders/:id" element={<OrderRoute />} />
    <Route path="returns" element={<Returns />} />
    <Route path="customers" element={<Customers />} />
    <Route path="customers/:id" element={<CustomerDetail />} />
    <Route path="groups" element={<Groups />} />
    <Route path="abandoned-carts" element={<AbandonedCarts />} />

    <Route path="products" element={<Products />} />
    <Route path="products/new" element={<ProductEditor />} />
    <Route path="products/:id" element={<ProductEditor />} />
    <Route path="categories" element={<Categories />} />
    <Route path="collections" element={<Collections />} />
    <Route path="attributes" element={<Attributes />} />
    <Route path="inventory" element={<Inventory />} />
    <Route path="inventory/low" element={<Navigate to="/admin/inventory?stock=low" replace />} />
    <Route path="inventory/history" element={<Navigate to="/admin/inventory?tab=history" replace />} />

    <Route path="beads" element={<Beads />} />
    <Route path="intentions" element={<Intentions />} />
    <Route path="studio-layers" element={<StudioLayers />} />
    <Route path="config" element={<StudioConfig />} />

    <Route path="coupons" element={<Coupons />} />
    <Route path="offers" element={<Offers />} />
    <Route path="flash-sales" element={<FlashSales />} />
    <Route path="banners" element={<Banners />} />
    <Route path="featured" element={<Featured />} />
    <Route path="newsletter" element={<Newsletter />} />

    <Route path="home-layout" element={<HomeLayout />} />
    <Route path="content" element={<SitePages />} />
    <Route path="blog" element={<Blog />} />
    <Route path="faqs" element={<Faqs />} />
    <Route path="media" element={<Media />} />
    <Route path="contacts" element={<Contacts />} />

    <Route path="settings" element={<Settings />} />
    <Route path="shipping" element={<Shipping />} />
    <Route path="users" element={<Users />} />
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Route>
);
