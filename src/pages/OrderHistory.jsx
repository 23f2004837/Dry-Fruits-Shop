import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import Header from '../components/Header';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderHistory();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load order history');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-history-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <h2>Order History</h2>
          
          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>You haven't placed any orders yet</p>
              <button onClick={() => navigate('/')} className="shop-now-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order._id.slice(-8)}</h3>
                      <p className="order-date">
                        {new Date(order.orderDate).toLocaleDateString()} at{' '}
                        {new Date(order.orderDate).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${order.paymentStatus}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-details">
                          Qty: {item.quantity} × ₹{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-info">
                      <span>Payment: {order.paymentMethod}</span>
                      <span>Delivery: Flat {order.flatNumber}</span>
                    </div>
                    <div className="order-total">
                      Total: ₹{order.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderHistory;
