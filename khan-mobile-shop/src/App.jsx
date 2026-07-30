import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import AOS from 'aos';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Toast from './components/Toast';
import WhatsAppButton from './components/WhatsAppButton';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMessages from './pages/admin/AdminMessages';
import AdminReviews from './pages/admin/AdminReviews';
import AdminProductForm from './pages/admin/AdminProductForm';
import NotFound from './pages/NotFound';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"                   element={<Home />} />
      <Route path="/shop"               element={<Shop />} />
      <Route path="/product/:id"        element={<ProductDetail />} />
      <Route path="/categories"         element={<Categories />} />
      <Route path="/cart"               element={<Cart />} />
      <Route path="/checkout"           element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
      <Route path="/orders"             element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/about"              element={<About />} />
      <Route path="/contact"            element={<Contact />} />
      <Route path="/login"              element={<Login />} />
      <Route path="/signup"             element={<Signup />} />
      <Route path="/reset-password"     element={<ResetPassword />} />
      <Route path="/verify-email"       element={<VerifyEmail />} />
      <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/orders"       element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/messages"     element={<AdminRoute><AdminMessages /></AdminRoute>} />
      <Route path="/admin/reviews"      element={<AdminRoute><AdminReviews /></AdminRoute>} />
      <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      <Route path="*"                   element={<NotFound />} />
    </Routes>
 <Toast />
    <WhatsAppButton />
    <EmailVerificationBanner />
  </BrowserRouter>
);

const App = () => {
  useEffect(() => {
    AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true });
  }, []);

  const providers = (children) => GOOGLE_CLIENT_ID
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
    : children;

  return (
    <HelmetProvider>
      {providers(
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      )}
    </HelmetProvider>
  );
};

export default App;
