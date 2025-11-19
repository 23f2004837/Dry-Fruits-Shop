import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header';
import './OrderSummary.css';

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderPlaced = location.state?.orderPlaced;

  useEffect(() => {
    if (!orderPlaced) {
      navigate('/');
    }
  }, [orderPlaced, navigate]);

  if (!orderPlaced) {
    return null;
  }

  return (
    <div className="order-summary-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2>Order Placed Locally!</h2>
            <p className="success-message">
              Your order details have been shared via WhatsApp. 
              The shop will contact you to confirm your order and arrange delivery.
            </p>
            
            <div className="order-details">
              <h3>What happens next?</h3>
              
              <div className="info-box">
                <p>📱 <strong>WhatsApp Sent:</strong> Your order summary has been prepared for WhatsApp</p>
                <p>🛍️ <strong>Shop Contact:</strong> The shop will reach out to confirm your order</p>
                <p>🚚 <strong>Delivery:</strong> Delivery details will be arranged via WhatsApp</p>
                <p>💳 <strong>Payment:</strong> Payment options will be discussed during confirmation</p>
              </div>
            </div>
            
            <div className="info-note">
              <p>
                <strong>Note:</strong> This is a client-side application. Your cart has been cleared 
                and your order summary was prepared for WhatsApp sharing. No data is stored on any server.
              </p>
            </div>
            
            <div className="action-buttons">
              <button onClick={() => navigate('/')} className="home-btn">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSummary;
