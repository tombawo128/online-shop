import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { config } from './config.js';
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import CartDrawer from './components/cartdrawer.jsx';
import ToastContainer from './components/toast.jsx';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/home.jsx'));
const Shop = lazy(() => import('./pages/shop.jsx'));
const Product = lazy(() => import('./pages/product.jsx'));
const Cart = lazy(() => import('./pages/cart.jsx'));
const Checkout = lazy(() => import('./pages/checkout.jsx'));
const AuthPage = lazy(() => import('./pages/auth.jsx'));
const AccountPage = lazy(() => import('./pages/account.jsx'));
const Admin = lazy(() => import('./admin/admin.jsx'));
const NotFound = lazy(() => import('./pages/notfound.jsx'));

// Auto scroll to top on navigation
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith(config.adminPath);

  return (
    <div className="site-wrapper">
      <ScrollToTop />
      {!isAdmin && <Header />}
      <CartDrawer />
      <ToastContainer />

      <main className="main-content-flow">
        <Suspense fallback={
          <div className="app-page-loading">
            <div className="loading-spinner" />
            <p>Loading collection…</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<AuthPage defaultMode="signin" />} />
            <Route path="/signin" element={<AuthPage defaultMode="signin" />} />
            <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path={config.adminPath} element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}
