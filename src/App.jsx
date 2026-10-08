import { lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useWishlistStore } from './store/wishlistStore';
import { useContentStore } from './store/contentStore';
import { useSettingsStore } from './store/settingsStore';
import StoreLayout from './components/layout/StoreLayout';
import { adminRoutes } from './admin/routes';
import { RequireAuth } from './components/gates';
import HomePage from './pages/HomePage';
import { STUDIO_PATHS } from './lib/studioFlow';

// The home page ships with the first download; every other page loads when it is opened.
const FamilyPage = lazy(() => import('./pages/FamilyPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CustomizePage = lazy(() => import('./pages/CustomizePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const CollectionsIndexPage = lazy(() => import('./pages/CollectionsIndexPage'));
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const ShopByPurposePage = lazy(() => import('./pages/ShopByPurposePage'));

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
        {adminRoutes}
        <Route path="/family/:family" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
