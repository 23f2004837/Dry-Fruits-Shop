import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/admin';
import './ProductCard.css';

const ProductCard = ({ product, onEdit }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    onEdit?.(product);
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.imageUrl || product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          {product.quality && <span className="product-quality">Quality: {product.quality}</span>}
          {typeof product.quantity === 'number' && product.quantity >= 0 && (
            <span className="product-quantity">Qty: {product.quantity}</span>
          )}
        </div>
        {isAdmin && onEdit && (
          <div className="product-admin-controls">
            <button type="button" className="product-admin-btn" onClick={handleEdit}>
              Edit Product
            </button>
          </div>
        )}
        <div className="product-footer">
          <span className="product-price">₹{product.price}</span>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
