import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SizeGuidePage from './pages/SizeGuidePage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider } from './context/AdminDataContext';

import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminAddProductPage from './pages/admin/AdminAddProductPage';
import AdminEditProductPage from './pages/admin/AdminEditProductPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCollectionsPage from './pages/admin/AdminCollectionsPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminDiscountsPage from './pages/admin/AdminDiscountsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminDeliveryPage from './pages/admin/AdminDeliveryPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminWebsitePage from './pages/admin/AdminWebsitePage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
    });
  }, [pathname]);

  return null;
}

// Global Shop Wrapper
function ShopLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Protected Admin Route
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AdminAuthProvider>
      <AdminDataProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Admin Public Auth Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
                <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

                {/* Admin Protected Routes */}
                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminAddProductPage />} />
                  <Route path="products/edit/:id" element={<AdminEditProductPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="collections" element={<AdminCollectionsPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="coupons" element={<AdminDiscountsPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="delivery" element={<AdminDeliveryPage />} />
                  <Route path="returns" element={<AdminReturnsPage />} />
                  <Route path="website" element={<AdminWebsitePage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="profile" element={<AdminProfilePage />} />
                </Route>

                {/* Storefront Routes */}
                <Route path="/" element={<ShopLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="product/:id" element={<ProductDetailPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="size-guide" element={<SizeGuidePage />} />
                  <Route path="return-policy" element={<ReturnPolicyPage />} />
                </Route>
              </Routes>
            </Router>
          </CartProvider>
        </ProductProvider>
      </AdminDataProvider>
    </AdminAuthProvider>
  );
}

export default App;
