import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="logo" onClick={() => navigate('/')}>
            🥜 Dry Fruits Shop
          </h1>
        </div>
        
        <div className="header-right">
          <button className="cart-button" onClick={() => navigate('/cart')}>
            🛒 Cart ({getTotalItems()})
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
