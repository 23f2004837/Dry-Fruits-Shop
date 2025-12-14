import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersForUser } from '../utils/firestoreData';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import OrderDetailsModal from './OrderDetailsModal';
import './OrdersModal.css';

const toJsDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return value ?? '—';
  return `₹${value.toFixed(2)}`;
};

const toStatusKey = (value, fallback = 'unknown') =>
  (value ?? fallback)
    .toString()
    .replace(/\s+/g, '-')
    .toLowerCase();

const OrdersModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!user?.uid) {
      setOrders([]);
      return;
    }

    let ignore = false;
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const results = await fetchOrdersForUser(user.uid);
        const sorted = [...results].sort((a, b) => {
          const aTime = toJsDate(a.createdAt)?.getTime() ?? 0;
          const bTime = toJsDate(b.createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        });
        if (!ignore) {
          setOrders(sorted);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
        if (!ignore) {
          setError('Failed to load your orders. Please try again.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [open, user?.uid]);

  useEffect(() => {
    if (!open) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDetailsOpen(false);
      setSelectedOrder(null);
    }
  }, [open]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  if (!open) return null;

  return (
    <>
      {createPortal(
        <div className="orders-modal-overlay" onClick={onClose}>
          <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="orders-modal-header">
              <h3>My Orders</h3>
              <button type="button" className="orders-close-btn" onClick={onClose}>
                ×
              </button>
            </div>
            {!user ? (
              <div className="orders-empty">
                <p>Please log in to view your orders.</p>
              </div>
            ) : loading ? (
              <div className="orders-empty">
                <p>Loading orders…</p>
              </div>
            ) : error ? (
              <div className="orders-empty">
                <p className="orders-error">{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-empty">
                <p>You have not placed any orders yet.</p>
              </div>
            ) : (
              <div className="orders-modal-body">
                <div className="orders-grid">
                  {orders.map((order) => {
                    const createdDate = toJsDate(order.createdAt);
                    const statusKey = toStatusKey(order.status, 'ordered');
                    return (
                      <div key={order.id} className="orders-card">
                        <div className="orders-card-header">
                          <div>
                            <p className="orders-card-label">Order</p>
                            <h4>#{order.invoiceNumber ?? order.id.slice(-8)}</h4>
                          </div>
                          <span className={`status-pill ${statusKey}`}>
                            {order.status ?? 'Ordered'}
                          </span>
                        </div>
                        <p className="orders-card-date">
                          {createdDate ? createdDate.toLocaleString() : 'Processing…'}
                        </p>
                        <div className="orders-card-meta">
                          <div>
                            <p className="meta-label">Items</p>
                            <p className="meta-value">{order.items?.length || 0}</p>
                          </div>
                          <div>
                            <p className="meta-label">Payment Method</p>
                            <p className="meta-value">{order.paymentMethod ?? '—'}</p>
                          </div>
                          <div>
                            <p className="meta-label">Payment Status</p>
                            <p className="meta-value">{order.paymentStatus ?? 'NotPaid'}</p>
                          </div>
                          <div>
                            <p className="meta-label">Delivery Status</p>
                            <p className="meta-value">{order.deliveryStatus ?? 'NotAssigned'}</p>
                          </div>
                        </div>
                        {order.deliveryAddress && (
                          <div className="orders-card-address">
                            <p className="meta-label">Delivery</p>
                            <p className="meta-value">{order.deliveryAddress}</p>
                          </div>
                        )}
                        <div className="orders-card-footer">
                          <div className="orders-card-total-wrap">
                            <span className="orders-card-total">{formatCurrency(order.total)}</span>
                            {order.invoiceNumber && (
                              <span className="orders-card-invoice">
                                Invoice: {order.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="orders-card-link"
                            onClick={() => handleViewDetails(order)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      <OrderDetailsModal
        open={detailsOpen}
        order={selectedOrder}
        invoice={null}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default OrdersModal;
