
import AccountPage from './pages/AccountPage';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import AdminResourcePage from './pages/admin/AdminResourcePage';
import AdminWorkspace from './components/admin/AdminWorkspace';
import ProductEditorPage from './pages/admin/ProductEditorPage';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
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
import PolicyPage from './pages/PolicyPage';
import { StoreSettingsProvider, useStoreSettings } from './context/StoreSettingsContext';

import { CartProvider } from './context/CartContext';
import { ProductProvider, useProducts } from './context/ProductContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider, useAdminData } from './context/AdminDataContext';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';

const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

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
  const {settings, error:settingsError,reload:reloadSettings}=useStoreSettings();
  const {error:contentError}=useAdminData();
  const location=useLocation();
  const maintenance=settings?.general.status==='MAINTENANCE' && !/^(\/account|\/contact|\/privacy-policy|\/terms|\/return-policy|\/shipping-policy|\/size-guide)/.test(location.pathname) && !location.search.includes('reference=');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {contentError&&<p role="alert" className="container-custom py-3 text-red-700">{contentError}</p>}
      {loading && <p role="status" className="container-custom py-3">Loading catalog?</p>}
      {error && <p role="alert" className="container-custom py-3 text-red-700">{error} <button className="underline" onClick={reload}>Retry</button></p>}
      <main className="flex-grow">
        {maintenance?<section className="container-custom section-padding text-center"><h1 className="font-serif text-3xl mb-6">We will be back soon</h1><p>{settings.general.maintenanceMessage}</p></section>:settingsError&&!settings?<p role="alert" className="container-custom section-padding">{settingsError} <button className="underline" onClick={reloadSettings}>Retry</button></p>:settings?<Outlet />:<p role="status" className="container-custom section-padding">Loading store...</p>}
      </main>
      <Footer />
    </div>
  );
}

// Protected Admin Route
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading,admin } = useAdminAuth();
  const location=useLocation();
  if (loading) return <p className="p-8">Checking your session?</p>;
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  const permissions=admin?.permissions||[];
  if(location.pathname==='/admin'&&!permissions.includes('VIEW_ANALYTICS'))return <Navigate replace to={permissions.includes('VIEW_ORDERS')?'/admin/orders':permissions.includes('MANAGE_INVENTORY')?'/admin/inventory':permissions.includes('VIEW_PRODUCTS')?'/admin/products':'/admin/settings?tab=account'}/>;
  const section=location.pathname.split('/')[2];
  const permission={products:'VIEW_PRODUCTS',categories:'VIEW_PRODUCTS',collections:'VIEW_PRODUCTS',inventory:'MANAGE_INVENTORY','stock-history':'MANAGE_INVENTORY',orders:'VIEW_ORDERS',customers:'VIEW_CUSTOMERS',payments:'VIEW_PAYMENTS',coupons:'MANAGE_PROMOTIONS',discounts:'MANAGE_PROMOTIONS',reviews:'EDIT_PRODUCTS',returns:'VIEW_ORDERS',reports:'VIEW_ANALYTICS',website:'MANAGE_WEBSITE',banners:'MANAGE_WEBSITE','homepage-sections':'MANAGE_WEBSITE',about:'MANAGE_WEBSITE','contact-content':'MANAGE_WEBSITE',messages:'VIEW_CUSTOMERS',staff:'MANAGE_STAFF','delivery-zones':'MANAGE_SETTINGS'}[section];
  if(permission&&!permissions.includes(permission))return <section className="container-custom section-padding"><h1>Access restricted</h1><p>Your role cannot access this section.</p><a href="/admin">Back to administration</a></section>;
  return children;
}

const router = createBrowserRouter(createRoutesFromElements(<Route element={<><ScrollToTop /><Outlet /></>}>

                {/* Admin Public Auth Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
                <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

                <Route path="/admin" element={<ProtectedAdminRoute><AdminWorkspace /></ProtectedAdminRoute>}>
                  <Route index element={<Suspense fallback={<p role="status">Loading dashboard...</p>}><AdminDashboardPage /></Suspense>} />
                  <Route path="products/new" element={<ProductEditorPage />} />
                  <Route path="products/edit/:id" element={<ProductEditorPage />} />
                  <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
                  <Route path="delivery" element={<Navigate to="/admin/delivery-zones" replace />} />
                  <Route path="settings" element={<Suspense fallback={<p role="status">Loading settings...</p>}><AdminSettingsPage /></Suspense>} />
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
                  <Route path="size-guide" element={<PolicyPage key="sizes" id="sizes" />} />
                  <Route path="privacy-policy" element={<PolicyPage key="privacy" id="privacy" />} />
                  <Route path="terms" element={<PolicyPage key="terms" id="terms" />} />
                  <Route path="shipping-policy" element={<PolicyPage key="shipping" id="shipping" />} />
                  <Route path="*" element={<p className="container-custom section-padding">Page not found. <a href="/">Go home</a></p>} />
                  <Route path="return-policy" element={<PolicyPage key="returns" id="returns" />} />
                </Route>

</Route>));

function SupabaseSyncNotice(){
  const {settings}=useStoreSettings();
  const error=useSupabaseSync(Boolean(settings));
  return error?<p role="status" className="container-custom py-3 text-brand-red">{error}</p>:null;
}
function App() {
  return (
    <StoreSettingsProvider><AdminAuthProvider>
      <SupabaseSyncNotice />
      <AdminDataProvider>
        <ProductProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </ProductProvider>
      </AdminDataProvider>
    </AdminAuthProvider></StoreSettingsProvider>
  );
}

export default App;
