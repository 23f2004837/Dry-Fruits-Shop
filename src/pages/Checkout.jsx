import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { createOrderWithInvoice } from '../utils/firestoreData';
import './Checkout.css';

const Checkout = () => {
  // Enter your WhatsApp number in FULL international format (no + or spaces)
  // Example for India: 919876543210
  const WHATSAPP_NUMBER = '917276729895';

  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try {
      return localStorage.getItem('deliveryAddress') || '';
    } catch {
      return '';
    }
  });

  // Compute totals
  const subtotal = Number(getTotalPrice());
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  // Persist address to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deliveryAddress', deliveryAddress || '');
    } catch {}
  }, [deliveryAddress]);

  // Show session loading state
  if (authLoading) {
    return (
      <div className="checkout-page">
        <Header />
        <main className="main-content">
          <div className="container">
            <p>Loading your session…</p>
          </div>
        </main>
      </div>
    );
  }

  // Handle empty cart
  if (!cartItems || cartItems.length === 0) {
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

  // --------------------------------------------------------------------------------------
  // ⭐ UPDATED: WhatsApp must open BEFORE async operations to avoid browser popup blocking
  // --------------------------------------------------------------------------------------
  const handlePlaceOrder = async () => {
    if (loading) return;

    setError('');
    setLoading(true);

    // Build WhatsApp message
    let message = 'Order from DryfruitApp:\n\n';

    cartItems.forEach(item => {
      message += `- ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(
        2
      )}\n`;
    });

    message += `\nSubtotal: ₹${subtotal.toFixed(2)}`;
    message += `\nTax (5%): ₹${taxAmount.toFixed(2)}`;
    message += `\nTotal: ₹${totalAmount.toFixed(2)}`;

    message += `\n\nDelivery address: ${
      deliveryAddress.trim() || '(Please provide)'
    }`;

    // Build the WhatsApp link
    const encoded = encodeURIComponent(message);
    const waUrl =
      WHATSAPP_NUMBER.trim()
        ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;

    // ⭐ IMPORTANT: Open WhatsApp immediately to avoid popup blocker ⭐
    window.open(waUrl, '_blank');

    // --------------------------------------------------------------------------------------
    // Continue Firestore operations in background AFTER WhatsApp is opened
    // --------------------------------------------------------------------------------------
    try {
      let orderRecord = null;

      if (isAuthenticated && user?.uid) {
        orderRecord = await createOrderWithInvoice({
          user,
          items: cartItems,
          subtotal,
          tax: taxAmount,
          total: totalAmount,
          deliveryAddress,
          paymentMethod: 'WhatsApp'
        });
      }

      // After WhatsApp is opened, clear cart and redirect
      clearCart();

      navigate('/order-summary', {
        state: {
          orderPlaced: true,
          orderRecord,
          totals: {
            subtotal,
            tax: taxAmount,
            total: totalAmount
          },
          deliveryAddress
        }
      });
    } catch (e) {
      console.error('Failed to save order to Firestore:', e);
      setError('Unable to save your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------------------

  return (
    <div className="checkout-page">
      <Header />

      <main className="main-content">
        <div className="container">
          <h2 className="checkout-title">Checkout</h2>

          <div className="checkout-content">
            {/* Delivery Section */}
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
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h3>Payment Method</h3>
              <div className="detail-box">
                <p className="payment-method-display">WhatsApp Order</p>
                <p className="payment-note">
                  WhatsApp will open with your order details.
                  {!isAuthenticated && (
                    <span className="auth-note"> Login to save this order.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Order Summary */}
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
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="total-row">
                  <span>Tax (5%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="total-row final">
                  <span>Total Amount:</span>
                  <span className="total-amount">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="checkout-actions">
              <button onClick={() => navigate('/cart')} className="back-btn">
                Back to Cart
              </button>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="place-order-btn"
              >
                {loading ? 'Opening WhatsApp…' : 'Place Order via WhatsApp'}
              </button>

              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
