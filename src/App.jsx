import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useWishlistStore } from './store/wishlistStore';
import { useContentStore } from './store/contentStore';
import { useSettingsStore } from './store/settingsStore';
import StoreLayout from './components/layout/StoreLayout';
import AdminLayout from './components/layout/AdminLayout';
import { RequireAdmin, RequireAuth } from './components/gates';
import HomePage from './pages/HomePage';
import FamilyPage from './pages/FamilyPage';
import ShopPage from './pages/ShopPage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminCategories from './pages/admin/Categories';
import AdminProducts from './pages/admin/Products';
import AdminBeads from './pages/admin/Beads';
import AdminCollections from './pages/admin/Collections';
import AdminInventory from './pages/admin/Inventory';
import AdminIntentions from './pages/admin/Intentions';
import AdminStudioLayers from './pages/admin/StudioLayers';
import AdminConfig from './pages/admin/Config';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminUsers from './pages/admin/Users';
import AdminCoupons from './pages/admin/Coupons';
import AdminOffers from './pages/admin/Offers';
import AdminFeatured from './pages/admin/Featured';
import AdminAbandonedCarts from './pages/admin/AbandonedCarts';
import AdminContent from './pages/admin/Content';
import AdminMedia from './pages/admin/Media';
import AdminSettings from './pages/admin/Settings';
import AdminAttributes from './pages/admin/Attributes';
import AdminBanners from './pages/admin/Banners';
import AdminFlashSales from './pages/admin/FlashSales';
import AdminFaqs from './pages/admin/Faqs';
import AdminBlog from './pages/admin/Blog';
import AdminNewsletter from './pages/admin/Newsletter';
import AdminNotifications from './pages/admin/Notifications';
import AdminReturns from './pages/admin/Returns';
import AdminShipping from './pages/admin/Shipping';
import AdminGroups from './pages/admin/Groups';
import AdminContacts from './pages/admin/Contacts';
import AdminHomeLayout from './pages/admin/HomeLayout';
import CollectionPage from './pages/CollectionPage';
import CollectionsIndexPage from './pages/CollectionsIndexPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import FaqPage from './pages/FaqPage';
import FlashSalePage from './pages/FlashSalePage';
import ShopByPurposePage from './pages/ShopByPurposePage';
import { STUDIO_PATHS } from './lib/studioFlow';

// The per-path pages folded into the single flow at /customize, so their old URLs
// (still linked from the footer and studioModes) forward into it.
function CustomizePathRedirect() {
  const { kind } = useParams();
  if (!STUDIO_PATHS.includes(kind)) return <Navigate to="/customize" replace />;
  return <Navigate to={`/customize?path=${kind}`} replace />;
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const onLogin = useCartStore((s) => s.onLogin);
  const syncWish = useWishlistStore((s) => s.sync);
  const loadContent = useContentStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    loadContent();
    loadSettings();
    hydrate().then((user) => {
      if (user) {
        onLogin();
        syncWish();
      }
    });
  }, [hydrate, onLogin, syncWish, loadContent, loadSettings]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/crystals" element={<FamilyPage />} />
          <Route path="/rudraksha" element={<FamilyPage />} />
          <Route path="/gemstones" element={<FamilyPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsIndexPage />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="/journal" element={<BlogListPage />} />
          <Route path="/journal/:slug" element={<BlogPostPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/sale" element={<FlashSalePage />} />
          <Route path="/shop-by-purpose" element={<Navigate to="/customize/purpose" replace />} />
          <Route path="/c/:slug" element={<CategoryPage />} />
          <Route path="/p/:slug" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/customize/purpose" element={<ShopByPurposePage />} />
          <Route path="/customize/:kind" element={<CustomizePathRedirect />} />
          <Route path="/customize" element={<CustomizePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/returns" element={<LegalPage kind="returns" />} />
          <Route path="/exchanges" element={<LegalPage kind="exchanges" />} />
          <Route path="/refunds" element={<LegalPage kind="refunds" />} />
          <Route path="/shipping" element={<LegalPage kind="shipping" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/maintenance" element={<LegalPage kind="maintenance" />} />
          <Route path="/grievance" element={<LegalPage kind="grievance" />} />
          <Route path="/contact" element={<Navigate to="/grievance" replace />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="beads" element={<AdminBeads />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="inventory/low" element={<AdminInventory />} />
          <Route path="inventory/history" element={<AdminInventory />} />
          <Route path="intentions" element={<AdminIntentions />} />
          <Route path="studio-layers" element={<AdminStudioLayers />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:tab" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="featured" element={<AdminFeatured />} />
          <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="groups" element={<AdminGroups />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="home-layout" element={<AdminHomeLayout />} />
        </Route>
        <Route path="/family/:family" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
