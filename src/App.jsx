import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
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
import AdminCategories from './pages/admin/Categories';
import AdminProducts from './pages/admin/Products';
import AdminBeads from './pages/admin/Beads';
import AdminIntentions from './pages/admin/Intentions';
import AdminConfig from './pages/admin/Config';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminContent from './pages/admin/Content';
import AdminMedia from './pages/admin/Media';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const onLogin = useCartStore((s) => s.onLogin);

  useEffect(() => {
    hydrate().then((user) => {
      if (user) onLogin();
    });
  }, [hydrate, onLogin]);

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
          <Route path="/c/:slug" element={<CategoryPage />} />
          <Route path="/p/:slug" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/customize" element={<CustomizePage />} />
          <Route path="/shop-by-purpose" element={<Navigate to="/customize" replace />} />
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
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
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
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="beads" element={<AdminBeads />} />
          <Route path="intentions" element={<AdminIntentions />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="media" element={<AdminMedia />} />
        </Route>
        <Route path="/family/:family" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
