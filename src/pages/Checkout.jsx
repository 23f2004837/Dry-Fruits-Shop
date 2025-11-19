import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      return;
    }

    setLoading(true);

    // Build order summary message
    let message = 'Order from DryfruitApp:\n\n';
    
    cartItems.forEach(item => {
      message += `- ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    const subtotal = getTotalPrice();
    const tax = (subtotal * 0.05).toFixed(2); // 5% tax
    const total = (subtotal + parseFloat(tax)).toFixed(2);
    
    message += `\nSubtotal: ₹${subtotal.toFixed(2)}\n`;
    message += `Tax (5%): ₹${tax}\n`;
    message += `Total: ₹${total}\n`;
    
    if (deliveryAddress.trim()) {
      message += `\nDelivery address: ${deliveryAddress}`;
    } else {
      message += `\nDelivery address: (Please provide)`;
    }

    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Clear cart and navigate to order summary
    setTimeout(() => {
      clearCart();
      setLoading(false);
      navigate('/order-summary', { state: { orderPlaced: true } });
    }, 500);
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button onClick={() => navigate('/')} className="back-btn">
                Go to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <h2>Checkout</h2>
          
          <div className="checkout-content">
            <div className="checkout-section">
              <h3>Delivery Details</h3>
              <div className="detail-box">
                <label htmlFor="deliveryAddress">
                  <strong>Delivery Address (Optional):</strong>
                </label>
                <input
                  id="deliveryAddress"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  className="address-input"
                />
                <p className="helper-text">
                  You can also provide your address via WhatsApp
                </p>
              </div>
            </div>
            
            <div className="checkout-section">
              <h3>Payment Method</h3>
              <div className="detail-box">
                <p className="payment-method-display">WhatsApp Order</p>
                <p className="payment-note">
                  After clicking "Place Order", WhatsApp will open with your order details. 
                  Share it with the shop to complete your order.
                </p>
              </div>
            </div>
            
            <div className="checkout-section">
              <h3>Order Summary</h3>
              <div className="order-items">
                {cartItems.map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="order-item-details">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <div className="order-item-price">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (5%):</span>
                  <span>₹{(getTotalPrice() * 0.05).toFixed(2)}</span>
                </div>
                <div className="total-row final">
                  <span>Total Amount:</span>
                  <span className="total-amount">₹{(getTotalPrice() * 1.05).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="checkout-actions">
              <button onClick={() => navigate('/cart')} className="back-btn">
                Back to Cart
              </button>
              <button 
                onClick={handlePlaceOrder} 
                disabled={loading}
                className="place-order-btn"
              >
                {loading ? 'Opening WhatsApp...' : 'Place Order via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
