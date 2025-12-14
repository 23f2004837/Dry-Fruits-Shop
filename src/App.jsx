import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSummary from './pages/OrderSummary';
import OrderBacklog from './pages/OrderBacklog';
import Login from './pages/Login';
import CompleteRegistration from './pages/CompleteRegistration';
import Footer from './components/Footer';
import InstallBanner from './components/InstallBanner';
import Splash from './components/Splash';
import { isAdminUser } from './utils/admin';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  return isAdminUser(user) ? children : <Navigate to="/" replace />;
}

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
      />

      <Route
        path="/register"
        element={!isAuthenticated ? <CompleteRegistration /> : <Navigate to="/" replace />}
      />

      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="/order-summary" element={<RequireAuth><OrderSummary /></RequireAuth>} />
      <Route
        path="/order-backlog"
        element={
          <RequireAuth>
            <RequireAdmin>
              <OrderBacklog />
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

const AppShell = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AppRoutes />
      {isAuthenticated && <Splash />}
      {isAuthenticated && <InstallBanner />}
      <Footer />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </Router>
    </AuthProvider>
  );
}
