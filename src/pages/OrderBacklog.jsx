import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
  fetchOpenOrders,
  updateOrderStatuses,
} from '../utils/firestoreData';
import { isAdminUser } from '../utils/admin';
import './OrderBacklog.css';

const toJsDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

const formatDateTime = (timestamp) => {
  const date = toJsDate(timestamp);
  return date ? date.toLocaleString() : 'Awaiting update';
};

const formatTimestampIso = (timestamp) => {
  const date = toJsDate(timestamp);
  return date ? date.toISOString() : '';
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/\r?\n/g, ' ').trim();
  return /[",]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
};

const buildOrderCsv = (orders = []) => {
  const headers = [
    'Order ID',
    'Invoice',
    'Customer Name',
    'Customer Email',
    'Order Status',
    'Order Status Updated',
    'Payment Status',
    'Payment Status Updated',
    'Delivery Status',
    'Delivery Status Updated',
    'Payment Method',
    'Subtotal',
    'Tax',
    'Total',
    'Delivery Address',
    'Items'
  ];

  const rows = orders.map((order) => {
    const itemSummary = (order.items ?? [])
      .map((item) => `${item.name ?? 'Item'} x${item.quantity ?? 0}`)
      .join(' | ');

    const values = [
      order.id ?? '',
      order.invoiceNumber ?? '',
      order.userName ?? '',
      order.userEmail ?? '',
      order.status ?? '',
      formatTimestampIso(order.statusUpdatedAt),
      order.paymentStatus ?? '',
      formatTimestampIso(order.paymentStatusUpdatedAt),
      order.deliveryStatus ?? '',
      formatTimestampIso(order.deliveryStatusUpdatedAt),
      order.paymentMethod ?? '',
      order.subtotal ?? '',
      order.tax ?? '',
      order.total ?? '',
      order.deliveryAddress ?? '',
      itemSummary
    ];

    return values.map(escapeCsvValue).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

const downloadCsvFile = (csvText, filename) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 400);
};

const openMailDraftWithCsv = ({ email, csvText, orderCount }) => {
  if (!email) return;
  const subject = encodeURIComponent('Order Backlog Export');
  const previewLimit = 1800;
  const preview = csvText.length > previewLimit ? `${csvText.slice(0, previewLimit)}…` : csvText;
  const bodyContent = [
    'Hi there,',
    '',
    `Here is the latest order backlog export covering ${orderCount} open orders.`,
    'A CSV file has been downloaded to your device for record keeping.',
    '',
    'CSV Preview:',
    preview,
    '',
    '-- Dry Fruits Shop Admin Console'
  ].join('\n');
  const body = encodeURIComponent(bodyContent);
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  window.open(mailto, '_blank');
};

const StatusControl = ({
  label,
  value,
  options,
  onChange,
  updatedAt,
  disabled,
}) => (
  <div className="status-control">
    <label>{label}</label>
    <div className="status-control-select">
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
    <span className="status-control-note">
      {updatedAt ? `Updated ${formatDateTime(updatedAt)}` : 'No updates yet'}
    </span>
  </div>
);

const OrderBacklog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingKey, setUpdatingKey] = useState('');
  const [exporting, setExporting] = useState(false);
  const isAdmin = isAdminUser(user);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!isAdmin) return [];
      if (!silent) {
        setLoading(true);
      }
      try {
        const results = await fetchOpenOrders();
        setOrders(results);
        setError('');
        return results;
      } catch (err) {
        console.error('Failed to load open orders', err);
        setError('Unable to load open orders. Please try again.');
        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, field, value) => {
    setUpdatingKey(`${orderId}-${field}`);
    try {
      await updateOrderStatuses({ orderId, [field]: value });
      await loadOrders(true);
    } catch (err) {
      console.error('Failed to update order status', err);
      setError('Failed to update status. Please retry.');
    } finally {
      setUpdatingKey('');
    }
  };

  const handleExportOrders = async () => {
    if (!isAdmin || exporting) return;
    if (!user?.email) {
      setError('Unable to export: your account email is missing.');
      return;
    }

    try {
      setExporting(true);
      const latest = await loadOrders(true);
      const exportSource = latest.length ? latest : orders;
      if (!exportSource.length) {
        setError('No open orders to export.');
        return;
      }

      const csvText = buildOrderCsv(exportSource);
      const filename = `order-backlog-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsvFile(csvText, filename);
      openMailDraftWithCsv({
        email: user.email,
        csvText,
        orderCount: exportSource.length,
      });
    } catch (err) {
      console.error('Failed to export orders', err);
      setError('Failed to export orders. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="order-backlog-page restricted">
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="restricted-card">
              <h2>Restricted</h2>
              <p>You do not have access to the order backlog.</p>
              <button type="button" className="backlog-button" onClick={() => navigate('/')}>
                Return Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="order-backlog-page">
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="backlog-toolbar">
            <div>
              <p className="backlog-eyebrow">Operations</p>
              <h2>Order Backlog</h2>
              <p className="backlog-subtitle">Track and progress every open order in one place.</p>
            </div>
            <div className="backlog-toolbar-actions">
              <button
                type="button"
                  className="backlog-button"
                onClick={() => loadOrders()}
                disabled={loading}
              >
                Refresh List
              </button>
                <button
                  type="button"
                  className="backlog-button secondary"
                  onClick={handleExportOrders}
                  disabled={exporting || loading}
                >
                  Export & Email CSV
                </button>
            </div>
          </div>

          {error && <div className="backlog-error">{error}</div>}

          {loading ? (
            <div className="backlog-loading">Loading open orders…</div>
          ) : orders.length === 0 ? (
            <div className="backlog-empty">
              <p>No open orders at the moment. Great job!</p>
            </div>
          ) : (
            <div className="backlog-list">
              {orders.map((order) => {
                const createdDate = formatDateTime(order.createdAt);
                return (
                  <div key={order.id} className="backlog-card">
                    <div className="backlog-card-header">
                      <div>
                        <p className="backlog-card-label">Order</p>
                        <h3>#{order.invoiceNumber ?? order.id.slice(-8)}</h3>
                        <p className="backlog-card-subtitle">Placed {createdDate}</p>
                      </div>
                      <div className="customer-chip">
                        <span>{order.userName}</span>
                        {order.userEmail && <span className="customer-email">{order.userEmail}</span>}
                      </div>
                    </div>

                    <div className="backlog-status-grid">
                      <StatusControl
                        label="Order Status"
                        value={order.status ?? ORDER_STATUS_OPTIONS[0]}
                        options={ORDER_STATUS_OPTIONS}
                        updatedAt={order.statusUpdatedAt}
                        disabled={updatingKey === `${order.id}-status`}
                        onChange={(value) => {
                          if (value === (order.status ?? ORDER_STATUS_OPTIONS[0])) return;
                          handleStatusChange(order.id, 'status', value);
                        }}
                      />
                      <StatusControl
                        label="Payment Status"
                        value={order.paymentStatus ?? PAYMENT_STATUS_OPTIONS[0]}
                        options={PAYMENT_STATUS_OPTIONS}
                        updatedAt={order.paymentStatusUpdatedAt}
                        disabled={updatingKey === `${order.id}-paymentStatus`}
                        onChange={(value) => {
                          if (value === (order.paymentStatus ?? PAYMENT_STATUS_OPTIONS[0])) return;
                          handleStatusChange(order.id, 'paymentStatus', value);
                        }}
                      />
                      <StatusControl
                        label="Delivery Status"
                        value={order.deliveryStatus ?? DELIVERY_STATUS_OPTIONS[0]}
                        options={DELIVERY_STATUS_OPTIONS}
                        updatedAt={order.deliveryStatusUpdatedAt}
                        disabled={updatingKey === `${order.id}-deliveryStatus`}
                        onChange={(value) => {
                          if (value === (order.deliveryStatus ?? DELIVERY_STATUS_OPTIONS[0])) return;
                          handleStatusChange(order.id, 'deliveryStatus', value);
                        }}
                      />
                    </div>

                    <div className="backlog-meta-grid">
                      <div>
                        <p className="meta-label">Items</p>
                        <p className="meta-value">{order.items?.length ?? 0}</p>
                      </div>
                      <div>
                        <p className="meta-label">Payment Method</p>
                        <p className="meta-value">{order.paymentMethod ?? '—'}</p>
                      </div>
                      <div>
                        <p className="meta-label">Total</p>
                        <p className="meta-value">₹{order.total ?? '—'}</p>
                      </div>
                    </div>

                    {order.items?.length ? (
                      <ul className="backlog-items">
                        {order.items.map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            <div className="item-info">
                              <span className="item-name">{item.name}</span>
                              {item.quality && (
                                <span className="item-quality">Quality: {item.quality}</span>
                              )}
                            </div>
                            <span className="item-count">Qty {item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="backlog-items empty">No line items synced.</p>
                    )}

                    {order.deliveryAddress && (
                      <div className="backlog-address">
                        <p className="meta-label">Delivery Address</p>
                        <p className="meta-value">{order.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderBacklog;
