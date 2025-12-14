import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import baner from '../assets/baner-header.png';
import cartIcon from '../assets/shopping-cart.png';
import OrdersModal from './OrdersModal';
import ProfileModal from './ProfileModal';

const Header = () => {
  const { getTotalItems, flashCounter } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isFlashing, setIsFlashing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!flashCounter) return;
    setIsFlashing(true);
    const t = setTimeout(() => setIsFlashing(false), 700);
    return () => clearTimeout(t);
  }, [flashCounter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  const handleOrders = () => {
    setMenuOpen(false);
    setOrdersOpen(true);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user?.name && !user?.email) return 'U';
    const source = user?.name || user?.email;
    return source.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <img
            src={baner}
            className="logo-img"
            alt="Dry Fruits Shop"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
          />
        </div>
        <div className="header-center" style={{ display: 'inline-grid' }}>
          <div className="header-title">Skydale DryFruits</div>
        </div>
        
        <div className="header-right">
          <button
            className={`cart-button ${isFlashing ? 'flash' : ''}`}
            onClick={() => navigate('/cart')}
            aria-label="Open cart"
          >
            <img src={cartIcon} alt="cart" className="cart-icon" />
            <span className="cart-count">{getTotalItems()}</span>
          </button>
          {user && (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-avatar"
                onClick={toggleMenu}
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                {user.photo ? (
                  <img src={user.photo} alt={user.name || 'Profile'} />
                ) : (
                  <span className="avatar-fallback">{getInitials()}</span>
                )}
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={handleProfile}>
                    Profile
                  </button>
                  <button type="button" onClick={handleOrders}>
                    Orders
                  </button>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
};

export default Header;
