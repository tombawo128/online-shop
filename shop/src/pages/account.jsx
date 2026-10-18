import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { config, money } from '../config.js';
import { Grid } from '../components/productcard.jsx';

export default function AccountPage() {
  const { user, logout, orders, wishlist, products, addToCart, toggleWishlist, addToast } = useStore();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'wishlist', 'settings'

  // Editable delivery profile
  const [shippingProfile, setShippingProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('urban_shipping_profile')) || {
        name: user?.name || '',
        phone: '',
        state: '',
        location: ''
      };
    } catch {
      return { name: user?.name || '', phone: '', state: '', location: '' };
    }
  });

  if (!user) {
    return (
      <main className="account-empty-wrap">
        <div className="account-gate-card">
          <div className="gate-icon">🔐</div>
          <h2>Access Your Wardrobe Account</h2>
          <p>Sign in to view your past orders, manage saved shipping details, and access your personal wishlist.</p>
          <div className="gate-actions">
            <Link to="/login" className="btn btn-primary">Sign In / Register</Link>
            <Link to="/shop" className="btn btn-ghost">Continue Shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  // Filter user orders
  const myOrders = orders.filter(o => !o.user_email || o.user_email === user.email || !user.email);
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const handleSaveShipping = (e) => {
    e.preventDefault();
    localStorage.setItem('urban_shipping_profile', JSON.stringify(shippingProfile));
    addToast('Shipping address saved for future orders!', 'success');
  };

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  return (
    <main className="account-page-wrap">
      {/* Account Profile Hero Banner */}
      <section className="account-hero-banner">
        <div className="account-hero-content">
          <div className="account-avatar-circle">
            {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="account-meta">
            <div className="account-name-badge">
              <h1>{user.name || 'Member'}</h1>
              <span className={`role-pill ${user.role === 'admin' ? 'role-admin' : 'role-customer'}`}>
                {user.role === 'admin' ? 'Store Administrator' : 'VIP Member'}
              </span>
            </div>
            <p className="account-email">{user.email}</p>
          </div>
        </div>

        <div className="account-hero-actions">
          {user.role === 'admin' && (
            <Link to={config.adminPath} className="btn btn-admin-accent">
              ⚡ Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Log Out
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="account-nav-tabs">
        <button
          className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          My Orders ({myOrders.length})
        </button>
        <button
          className={`account-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Wishlist ({wishlist.length})
        </button>
        <button
          className={`account-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Saved Address & Details
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <section className="account-section">
          {myOrders.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon">📦</div>
              <h3>No orders placed yet</h3>
              <p>Explore our latest arrivals and experience artisan tailoring.</p>
              <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-stack">
              {myOrders.map(order => (
                <article key={order.id} className="order-history-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-id-label">Order #{order.id}</span>
                      <p className="order-date-label">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="order-status-wrap">
                      <span className={`status-pill status-${order.status || 'pending'}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="order-items-table">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="order-item-info">
                          <strong>{item.qty} × {item.name}</strong>
                          <span className="order-item-variants">
                            Size: {item.size || 'M'} · Color: {item.color || 'Standard'}
                          </span>
                        </div>
                        <span className="order-item-price">
                          {money((item.price || 0) * (item.qty || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-shipping-dest">
                      <span>Delivery: </span>
                      <strong>{order.state || 'Local'}, {order.location || 'Direct Delivery'}</strong>
                    </div>
                    <div className="order-total-action">
                      <span className="order-sum-total">Total: <strong>{money(order.total || 0)}</strong></span>
                      <a
                        href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hi, inquiry regarding my order #${order.id}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-ghost"
                      >
                        WhatsApp Support
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <section className="account-section">
          {wishlistedProducts.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon">♥</div>
              <h3>Your wishlist is empty</h3>
              <p>Click the heart icon on any item to save your favorites here.</p>
              <Link to="/shop" className="btn btn-primary">Browse Clothes</Link>
            </div>
          ) : (
            <div className="wishlist-grid-wrap">
              <Grid items={wishlistedProducts} loading={false} />
            </div>
          )}
        </section>
      )}

      {/* Address & Settings Tab */}
      {activeTab === 'settings' && (
        <section className="account-section">
          <div className="address-form-card">
            <h3>Saved Delivery Information</h3>
            <p className="section-desc">Keep your contact and address up to date for instantaneous 1-click checkout.</p>
            <form onSubmit={handleSaveShipping} className="shipping-settings-form">
              <div className="form-group">
                <label>Recipient Name</label>
                <input
                  type="text"
                  value={shippingProfile.name}
                  onChange={e => setShippingProfile({ ...shippingProfile, name: e.target.value })}
                  placeholder="Full recipient name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input
                  type="tel"
                  value={shippingProfile.phone}
                  onChange={e => setShippingProfile({ ...shippingProfile, phone: e.target.value })}
                  placeholder="e.g. +1 555-0199"
                  required
                />
              </div>

              <div className="form-group">
                <label>State / Region</label>
                <input
                  type="text"
                  value={shippingProfile.state}
                  onChange={e => setShippingProfile({ ...shippingProfile, state: e.target.value })}
                  placeholder="e.g. California, London, Lagos"
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Delivery Street Address</label>
                <textarea
                  rows="3"
                  value={shippingProfile.location}
                  onChange={e => setShippingProfile({ ...shippingProfile, location: e.target.value })}
                  placeholder="Apartment, suite, street name, postal code"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Save Address
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
