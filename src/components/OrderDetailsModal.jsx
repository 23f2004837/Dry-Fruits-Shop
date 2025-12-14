import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './OrderDetailsModal.css';

const toJsDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return value ?? '—';
  }
  return `₹${value.toFixed(2)}`;
};

const formatStatusTimestamp = (timestamp) => {
  const date = toJsDate(timestamp);
  return date ? date.toLocaleString() : null;
};

const OrderDetailsModal = ({ open, order, invoice, onClose, onDownloadInvoice }) => {
  useEffect(() => {
    if (!open) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open || !order) return null;

  const createdDate = toJsDate(order.createdAt);
  const issuedDate = invoice ? toJsDate(invoice.issuedAt) : null;

  return createPortal(
    <div className="order-details-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-details-header">
          <div>
            <h3>Order #{order.invoiceNumber ?? order.id.slice(-8)}</h3>
            <p className="order-details-date">
              {createdDate ? createdDate.toLocaleString() : 'Processing time...'}
            </p>
          </div>
          <button type="button" className="order-details-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="order-details-body">
          <section className="order-details-section">
            <h4>Items</h4>
            {order.items?.length ? (
              <ul className="order-details-items">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${index}`} className="order-details-item">
                    <div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-meta">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                      {item.quality && (
                            <p className="item-quality">
                            Quality: {item.quality}
                            </p>
                    )}
                    </div>
                    <span className="item-total">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="order-details-empty">No items found for this order.</p>
            )}
          </section>

          <section className="order-details-section">
            <h4>Summary</h4>
            <div className="order-summary-grid">
              <div>
                <p className="label">Payment Method</p>
                <p>{order.paymentMethod ?? '—'}</p>
              </div>
              <div>
                <p className="label">Order Status</p>
                <p>{order.status ?? 'Ordered'}</p>
                {order.statusUpdatedAt && (
                  <p className="status-note">
                    Updated {formatStatusTimestamp(order.statusUpdatedAt)}
                  </p>
                )}
              </div>
              <div>
                <p className="label">Payment Status</p>
                <p>{order.paymentStatus ?? 'NotPaid'}</p>
                {order.paymentStatusUpdatedAt && (
                  <p className="status-note">
                    Updated {formatStatusTimestamp(order.paymentStatusUpdatedAt)}
                  </p>
                )}
              </div>
              <div>
                <p className="label">Delivery Status</p>
                <p>{order.deliveryStatus ?? 'NotAssigned'}</p>
                {order.deliveryStatusUpdatedAt && (
                  <p className="status-note">
                    Updated {formatStatusTimestamp(order.deliveryStatusUpdatedAt)}
                  </p>
                )}
              </div>
              <div>
                <p className="label">Subtotal</p>
                <p>{formatCurrency(order.subtotal)}</p>
              </div>
              <div>
                <p className="label">Tax</p>
                <p>{formatCurrency(order.tax)}</p>
              </div>
              <div>
                <p className="label">Total</p>
                <p className="order-summary-total">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </section>

          {order.deliveryAddress && (
            <section className="order-details-section">
              <h4>Delivery Address</h4>
              <p className="order-address-block">{order.deliveryAddress}</p>
            </section>
          )}

          {invoice && (
            <section className="order-details-section">
              <h4>Invoice</h4>
              <div className="invoice-info">
                <div>
                  <p className="label">Invoice Number</p>
                  <p>{invoice.invoiceNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="label">Issued</p>
                  <p>{issuedDate ? issuedDate.toLocaleString() : 'Processing...'}</p>
                </div>
                <div>
                  <p className="label">Payment</p>
                  <p>{invoice.paymentMethod ?? '—'}</p>
                </div>
                <button
                  type="button"
                  className="invoice-download-btn"
                  onClick={() => onDownloadInvoice?.(invoice)}
                >
                  Download Invoice
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailsModal;
