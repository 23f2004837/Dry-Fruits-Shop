import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSummary from './pages/OrderSummary';
import Footer from './components/Footer';
import InstallBanner from './components/InstallBanner';
import Splash from './components/Splash';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-summary" element={<OrderSummary />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Splash />
          <InstallBanner />
          <Footer />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
