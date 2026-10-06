
import AccountPage from './pages/AccountPage';
import AdminResourcePage, { AdminWorkspace } from './pages/admin/AdminResourcePage';
import ProductEditorPage from './pages/admin/ProductEditorPage';
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
import { ProductProvider, useProducts } from './context/ProductContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider } from './context/AdminDataContext';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';

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
  const { loading, error, reload } = useProducts();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {loading && <p role="status" className="container-custom py-3">Loading catalog?</p>}
      {error && <p role="alert" className="container-custom py-3 text-red-700">{error} <button className="underline" onClick={reload}>Retry</button></p>}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Protected Admin Route
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) return <p className="p-8">Checking your session?</p>;
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

                <Route path="/admin" element={<ProtectedAdminRoute><AdminWorkspace /></ProtectedAdminRoute>}>
                  <Route index element={<AdminResourcePage />} />
                  <Route path="products/new" element={<ProductEditorPage />} />
                  <Route path="products/edit/:id" element={<ProductEditorPage />} />
                  <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
                  <Route path="delivery" element={<Navigate to="/admin/delivery-zones" replace />} />
                  <Route path=":section" element={<AdminResourcePage />} />
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
                  <Route path="account" element={<AccountPage />} />
                  <Route path="account/orders/:orderId" element={<AccountPage />} />
                  <Route path="size-guide" element={<SizeGuidePage />} />
                  <Route path="*" element={<p className="container-custom section-padding">Page not found. <a href="/">Go home</a></p>} />
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
