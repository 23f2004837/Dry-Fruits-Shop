import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';
import baner from '../assets/baner-header.png';
import cartIcon from '../assets/shopping-cart.png';

const Header = () => {
  const { getTotalItems, flashCounter } = useCart();
  const navigate = useNavigate();
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!flashCounter) return;
    setIsFlashing(true);
    const t = setTimeout(() => setIsFlashing(false), 700);
    return () => clearTimeout(t);
  }, [flashCounter]);

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
        </div>
      </div>
    </header>
  );
};

export default Header;
