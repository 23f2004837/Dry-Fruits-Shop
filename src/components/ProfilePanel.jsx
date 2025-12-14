import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersForUser } from '../utils/firestoreData';
import '../pages/Profile.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = ['#667eea', '#764ba2', '#ffb347', '#ff5f6d', '#4fd1c5', '#f6ad55'];

const toJsDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
};

const ProfilePanel = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    let ignore = false;
    const loadOrders = async () => {
      setLoadingOrders(true);
      setOrdersError('');
      try {
        const data = await fetchOrdersForUser(user.uid);
        if (!ignore) {
          setOrders(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile orders', error);
        if (!ignore) {
          setOrdersError('Unable to load orders right now.');
        }
      } finally {
        if (!ignore) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [user?.uid]);

  const itemCounts = useMemo(() => {
    const counts = {};
    orders.forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const key = item?.name?.trim() || 'Unnamed Item';
        const qty = Number(item?.quantity) || 1;
        counts[key] = (counts[key] || 0) + qty;
      });
    });
    return counts;
  }, [orders]);

  const chartData = useMemo(() => {
    const labels = Object.keys(itemCounts);
    const data = labels.map((label) => itemCounts[label]);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, idx) => palette[idx % palette.length]),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  }, [itemCounts]);

  const joinedDate = toJsDate(user?.createdAt);
  const hasChartData = chartData.labels.length > 0 && chartData.datasets[0].data.some(Boolean);

  if (!user) {
    return (
      <div className="profile-card">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <h2>My Profile</h2>
      <div className="profile-content">
        <div className="profile-avatar-section">
          <img
            src={user.photo || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="profile-avatar-large"
          />
          <p className="profile-name">{user.name || user.email}</p>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">{joinedDate ? joinedDate.toLocaleDateString() : '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Orders Placed:</span>
            <span className="info-value">{loadingOrders ? 'Loading…' : orders.length}</span>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <p className="stat-label">Total Orders</p>
          <p className="stat-value">{loadingOrders ? '—' : orders.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">First Order</p>
          <p className="stat-value">
            {orders.length > 0
              ? (() => {
                  const first = orders[orders.length - 1];
                  const dt = toJsDate(first?.createdAt);
                  return dt ? dt.toLocaleDateString() : '—';
                })()
              : '—'}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Latest Order</p>
          <p className="stat-value">
            {orders.length > 0
              ? (() => {
                  const latest = orders[0];
                  const dt = toJsDate(latest?.createdAt);
                  return dt ? dt.toLocaleDateString() : '—';
                })()
              : '—'}
          </p>
        </div>
      </div>

      <div className="profile-chart-card">
        <div className="chart-header">
          <h3>Items Ordered</h3>
          {loadingOrders && <span className="chart-subtitle">Loading…</span>}
          {ordersError && <span className="chart-subtitle error">{ordersError}</span>}
        </div>
        {hasChartData ? (
          <div className="chart-wrapper">
            <Doughnut
              data={chartData}
              options={{
                plugins: {
                  legend: { position: 'right' }
                },
                cutout: '65%',
                maintainAspectRatio: false
              }}
            />
          </div>
        ) : (
          <div className="chart-empty">No order data yet.</div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
