import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersForUser, fetchInvoicesForUser } from '../utils/firestoreData';
import OrderDetailsModal from '../components/OrderDetailsModal';
import './OrderHistory.css';

const toJsDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

const toStatusKey = (value, fallback = 'unknown') =>
  (value ?? fallback)
    .toString()
    .replace(/\s+/g, '-')
    .toLowerCase();

const formatStatusLabel = (value, fallback) => value ?? fallback;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setOrders([]);
      setInvoices({});
      setLoading(false);
      setError('');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const [orderData, invoiceData] = await Promise.all([
          fetchOrdersForUser(user.uid),
          fetchInvoicesForUser(user.uid)
        ]);
        const invoiceMap = invoiceData.reduce((acc, invoice) => {
          acc[invoice.orderId] = invoice;
          return acc;
        }, {});
        setOrders(orderData);
        setInvoices(invoiceMap);
        setError('');
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, user?.uid]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const selectedInvoice = selectedOrder ? invoices[selectedOrder.id] : null;

  const handleDownloadInvoice = (invoice) => {
    if (!invoice) return;
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      issuedAt: toJsDate(invoice.issuedAt)?.toISOString() ?? null,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      items: invoice.items,
      deliveryAddress: invoice.deliveryAddress,
      paymentMethod: invoice.paymentMethod
    };
    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber || 'invoice'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="order-history-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <h2>Order History</h2>
          
          {loading || authLoading ? (
            <div className="loading">Loading orders...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : !user ? (
            <div className="empty-orders">
              <p>Please log in to view your order history.</p>
              <button onClick={() => navigate('/login')} className="shop-now-btn">
                Login
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>You haven't placed any orders yet</p>
              <button onClick={() => navigate('/')} className="shop-now-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.invoiceNumber ?? order.id.slice(-8)}</h3>
                      <p className="order-date">
                        {(() => {
                          const createdDate = toJsDate(order.createdAt);
                          return createdDate
                            ? `${createdDate.toLocaleDateString()} at ${createdDate.toLocaleTimeString()}`
                            : 'Processing time...';
                        })()}
                      </p>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${toStatusKey(order.status, 'ordered')}`}>
                        {formatStatusLabel(order.status, 'Ordered')}
                      </span>
                      <span
                        className={`status-badge subtle ${toStatusKey(order.paymentStatus, 'notpaid')}`}
                      >
                        Payment: {formatStatusLabel(order.paymentStatus, 'NotPaid')}
                      </span>
                      <span
                        className={`status-badge subtle ${toStatusKey(
                          order.deliveryStatus,
                          'notassigned'
                        )}`}
                      >
                        Delivery: {formatStatusLabel(order.deliveryStatus, 'NotAssigned')}
                      </span>
                    </div>
                  </div>

                  <div className="order-meta">
                    <div>
                      <p className="meta-label">Items</p>
                      <p className="meta-value">{order.items?.length || 0}</p>
                    </div>
                    <div>
                      <p className="meta-label">Payment</p>
                      <p className="meta-value">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="meta-label">Status</p>
                      <p className="meta-value">{formatStatusLabel(order.status, 'Ordered')}</p>
                      {order.statusUpdatedAt && (
                        <p className="meta-note">
                          Updated {toJsDate(order.statusUpdatedAt)?.toLocaleString() ?? ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="meta-label">Delivery Status</p>
                      <p className="meta-value">
                        {formatStatusLabel(order.deliveryStatus, 'NotAssigned')}
                      </p>
                      {order.deliveryStatusUpdatedAt && (
                        <p className="meta-note">
                          Updated {toJsDate(order.deliveryStatusUpdatedAt)?.toLocaleString() ?? ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="meta-label">Payment Status</p>
                      <p className="meta-value">
                        {formatStatusLabel(order.paymentStatus, 'NotPaid')}
                      </p>
                      {order.paymentStatusUpdatedAt && (
                        <p className="meta-note">
                          Updated {toJsDate(order.paymentStatusUpdatedAt)?.toLocaleString() ?? ''}
                        </p>
                      )}
                    </div>
                    {order.deliveryAddress && (
                      <div className="meta-address">
                        <p className="meta-label">Delivery</p>
                        <p className="meta-value">{order.deliveryAddress}</p>
                      </div>
                    )}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span>
                        {(() => {
                          const total = typeof order.total === 'number'
                            ? order.total.toFixed(2)
                            : order.total ?? '—';
                          return `Total: ₹${total}`;
                        })()}
                      </span>
                      {order.invoiceNumber && (
                        <span className="invoice-number">Invoice: {order.invoiceNumber}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="order-details-link"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <OrderDetailsModal
        open={detailsOpen}
        order={selectedOrder}
        invoice={selectedInvoice}
        onClose={handleCloseDetails}
        onDownloadInvoice={handleDownloadInvoice}
      />
    </div>
  );
};

export default OrderHistory;
