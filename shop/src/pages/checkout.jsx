import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { config, money } from '../config.js';

export default function Checkout() {
  const { cart, total, subtotal, discountAmount, discountCode, shippingFee, clearCart, saveOrder, user } = useStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    location: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Pre-fill user profile if available
  useEffect(() => {
    try {
      const savedProfile = JSON.parse(localStorage.getItem('urban_shipping_profile')) || {};
      setForm(prev => ({
        ...prev,
        name: user?.name || savedProfile.name || '',
        email: user?.email || '',
        phone: savedProfile.phone || '',
        state: savedProfile.state || '',
        location: savedProfile.location || ''
      }));
    } catch {
      if (user) {
        setForm(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || ''
        }));
      }
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Please provide your full name.';
    }
    if (!form.phone.trim() || !/^\+?[0-9\s-]{7,18}$/.test(form.phone.trim())) {
      errs.phone = 'Please provide a valid phone number for delivery updates.';
    }
    if (!form.state.trim()) {
      errs.state = 'Please specify your state or region.';
    }
    if (!form.location.trim() || form.location.trim().length < 5) {
      errs.location = 'Please provide your full delivery address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);

    const orderData = {
      customer_name: form.name.trim(),
      customer_email: form.email.trim() || user?.email || null,
      phone: form.phone.trim(),
      state: form.state.trim(),
      location: form.location.trim(),
      notes: form.notes.trim() || null,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        size: i.size,
        color: i.color,
        qty: i.qty,
        price: i.price,
        image: i.image
      })),
      subtotal,
      discount: discountAmount,
      discount_code: discountCode || null,
      shipping: shippingFee,
      total,
      status: 'pending'
    };

    try {
      const created = await saveOrder(orderData);

      // Save shipping profile for future convenience
      try {
        localStorage.setItem('urban_shipping_profile', JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          state: form.state.trim(),
          location: form.location.trim()
        }));
      } catch (err) {
        console.warn(err);
      }

      // Format WhatsApp dispatch message
      const itemsText = orderData.items
        .map(i => `• ${i.qty}x ${i.name} [Size: ${i.size}, Color: ${i.color}] - ${money(i.price * i.qty)}`)
        .join('\n');

      const waMsg = `Hello Urban Thread! 🛍️\nI have placed an order.\n\nOrder Ref: #${created.id}\nCustomer: ${orderData.customer_name}\nPhone: ${orderData.phone}\nDelivery Address: ${orderData.location}, ${orderData.state}\n\nItems:\n${itemsText}\n\nTotal: ${money(total)}\n\nPlease send payment details to complete my order. Thank you!`;

      setCompletedOrder({
        order: created,
        waMsg,
        waUrl: `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(waMsg)}`
      });

      clearCart();
    } catch (err) {
      setErrors({ form: 'An issue occurred while recording your order. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  // Order Confirmation State
  if (completedOrder) {
    const { order, waUrl } = completedOrder;
    return (
      <main className="checkout-success-container">
        <div className="order-receipt-card">
          <div className="receipt-badge-icon">✓</div>
          <span className="receipt-ref-pill">ORDER #{order.id} CONFIRMED</span>
          <h1>Thank you, {order.customer_name}!</h1>
          <p className="receipt-sub">
            Your wardrobe request has been reserved. To complete payment and coordinate express delivery, connect directly with our studio concierge on WhatsApp.
          </p>

          <div className="whatsapp-action-box">
            <div className="wa-box-header">
              <span className="wa-icon">💬</span>
              <div>
                <strong>Instant Studio Concierge</strong>
                <p>Seller WhatsApp: +{config.whatsapp}</p>
              </div>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-block btn-lg"
            >
              Open WhatsApp & Send Order Details →
            </a>
          </div>

          <div className="receipt-summary-box">
            <h3>Order Overview</h3>
            <div className="receipt-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <span>{item.qty} × {item.name} ({item.size}, {item.color})</span>
                  <strong>{money(item.price * item.qty)}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-totals-section">
              <div className="receipt-total-line">
                <span>Shipping Destination:</span>
                <span>{order.location}, {order.state}</span>
              </div>
              <div className="receipt-total-line">
                <span>Contact Phone:</span>
                <span>{order.phone}</span>
              </div>
              <div className="receipt-total-line total-highlight">
                <span>Total Amount:</span>
                <span className="amount-strong">{money(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="receipt-footer-links">
            <Link to="/account" className="btn btn-ghost">
              View Order in My Account
            </Link>
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Empty cart fallback
  if (!cart.length) {
    return (
      <main className="center-empty-screen">
        <div className="empty-box">
          <h2>Your Bag is Empty</h2>
          <p>Please select pieces from our collection before proceeding to checkout.</p>
          <Link to="/shop" className="btn btn-primary">
            Explore Collection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page-wrap">
      <div className="checkout-header">
        <span className="checkout-eyebrow">FINAL STEP</span>
        <h1>Secure Checkout</h1>
        <p>Complete your delivery coordinates below.</p>
      </div>

      {/* Guest vs Member Prompt */}
      {!user && (
        <div className="checkout-signin-banner">
          <div className="signin-banner-text">
            <span>✨ Have an Urban Thread account?</span>
            <p>Sign in to automatically load your saved delivery address and track this order.</p>
          </div>
          <Link to="/login?redirect=/checkout" className="btn btn-sm btn-outline">
            Sign In Now
          </Link>
        </div>
      )}

      <div className="checkout-grid-layout">
        {/* Left: Shipping Form */}
        <section className="checkout-form-section">
          <form onSubmit={handleSubmit} noValidate className="checkout-shipping-form">
            <h2>1. Delivery Details</h2>

            {errors.form && (
              <div className="checkout-alert-error">{errors.form}</div>
            )}

            <div className="form-group">
              <label htmlFor="chk-name">Recipient Full Name *</label>
              <input
                id="chk-name"
                type="text"
                placeholder="e.g. Julian Henderson"
                value={form.name}
                onChange={handleChange('name')}
                required
              />
              {errors.name && <span className="field-err">{errors.name}</span>}
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="chk-phone">Contact Phone Number *</label>
                <input
                  id="chk-phone"
                  type="tel"
                  placeholder="For courier dispatch call"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  required
                />
                {errors.phone && <span className="field-err">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="chk-email">Email Address (Optional)</label>
                <input
                  id="chk-email"
                  type="email"
                  placeholder="For receipt & tracking"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="chk-state">State / Region / Province *</label>
              <input
                id="chk-state"
                type="text"
                placeholder="e.g. California, Greater London, Lagos, Ontario"
                value={form.state}
                onChange={handleChange('state')}
                required
              />
              {errors.state && <span className="field-err">{errors.state}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="chk-loc">Full Delivery Street Address *</label>
              <textarea
                id="chk-loc"
                rows="3"
                placeholder="Apartment / Villa / Street, Postal Code, Gate code if any"
                value={form.location}
                onChange={handleChange('location')}
                required
              />
              {errors.location && <span className="field-err">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="chk-notes">Delivery Instructions / Courier Notes (Optional)</label>
              <input
                id="chk-notes"
                type="text"
                placeholder="e.g. Leave with security, call upon arrival"
                value={form.notes}
                onChange={handleChange('notes')}
              />
            </div>

            <h2 className="mt-4">2. Payment Method</h2>
            <div className="payment-options-card">
              <div className="payment-radio-selected">
                <input type="radio" id="pay-whatsapp" name="payment" defaultChecked readOnly />
                <label htmlFor="pay-whatsapp">
                  <strong>Direct Studio Concierge (WhatsApp)</strong>
                  <p>
                    Verify availability, finalize bank transfer / mobile money with the studio manager, and receive immediate dispatch tracking.
                  </p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg checkout-submit-btn"
              disabled={busy}
            >
              {busy ? 'Securing your order…' : `Place Order • ${money(total)}`}
            </button>
          </form>
        </section>

        {/* Right: Order Summary */}
        <aside className="checkout-summary-section">
          <div className="checkout-summary-card">
            <h3>Your Order ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h3>

            <div className="checkout-items-stack">
              {cart.map(item => (
                <div key={item.key} className="checkout-item-compact">
                  <img src={item.image} alt={item.name} className="compact-img" />
                  <div className="compact-info">
                    <strong>{item.name}</strong>
                    <span className="compact-meta">Size: {item.size} · Color: {item.color} · Qty: {item.qty}</span>
                  </div>
                  <span className="compact-price">{money(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <hr className="compact-sep" />

            <div className="checkout-pricing-breakdown">
              <div className="compact-line">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="compact-line line-discount">
                  <span>Coupon Discount ({discountCode})</span>
                  <span>-{money(discountAmount)}</span>
                </div>
              )}
              <div className="compact-line">
                <span>Express Courier Shipping</span>
                <span>{shippingFee === 0 ? 'Complimentary' : money(shippingFee)}</span>
              </div>
              <hr className="compact-sep" />
              <div className="compact-line line-final">
                <span>Total Amount Due</span>
                <span className="final-price-tag">{money(total)}</span>
              </div>
            </div>

            <div className="guarantee-box">
              <p>🛡️ <strong>Artisan Quality Guarantee:</strong> Every piece is inspected by hand before dispatch. 30 days hassle-free exchange policy.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
