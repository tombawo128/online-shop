import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { money } from '../config.js';

export default function Cart() {
  const {
    cart,
    count,
    subtotal,
    total,
    shippingFee,
    shippingThreshold,
    discountCode,
    discountAmount,
    applyPromoCode,
    removePromoCode,
    setQty,
    removeFromCart
  } = useStore();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const nav = useNavigate();

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCodeInput.trim()) return;
    const res = applyPromoCode(promoCodeInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoCodeInput('');
    }
  };

  if (!cart.length) {
    return (
      <main className="cart-page-wrap">
        <div className="cart-empty-screen">
          <div className="empty-icon-bubble">🛍️</div>
          <h2>Your Shopping Bag is Empty</h2>
          <p>You haven't added any clothes yet. Discover our collection for women and men.</p>
          <div className="empty-btn-group">
            <Link to="/shop?gender=women" className="btn btn-primary">
              Shop Women
            </Link>
            <Link to="/shop?gender=men" className="btn btn-outline">
              Shop Men
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const freeShippingLeft = Math.max(0, shippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / shippingThreshold) * 100));

  return (
    <main className="cart-page-wrap">
      <div className="cart-header-row">
        <div>
          <span className="cart-eyebrow">YOUR BAG</span>
          <h1>Shopping Bag ({count} {count === 1 ? 'item' : 'items'})</h1>
        </div>
        <Link to="/shop" className="link-continue-shopping">
          ← Continue Shopping
        </Link>
      </div>

      {/* Free Shipping Alert Bar */}
      <div className="cart-shipping-meter-box">
        {subtotal >= shippingThreshold ? (
          <p className="shipping-text-success">
            ✨ You've qualified for <strong>Free Delivery</strong>.
          </p>
        ) : (
          <p className="shipping-text-pending">
            Add <strong>{money(freeShippingLeft)}</strong> more to unlock <strong>Free Delivery</strong>.
          </p>
        )}
        <div className="cart-progress-bar">
          <div
            className="cart-progress-fill"
            style={{ width: `${freeShippingPercent}%` }}
          />
        </div>
      </div>

      <div className="cart-layout-grid">
        {/* Items List */}
        <div className="cart-items-column">
          <div className="cart-table-head">
            <span>Item</span>
            <span>Quantity</span>
            <span className="text-right">Total</span>
          </div>

          <div className="cart-items-list">
            {cart.map(item => (
              <div key={item.key} className="cart-row-item">
                <div className="cart-item-preview">
                  <Link to={`/product/${item.id}`} className="cart-thumb-wrap">
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div className="cart-item-text">
                    <Link to={`/product/${item.id}`} className="cart-item-title">
                      {item.name}
                    </Link>
                    <div className="cart-variant-tags">
                      <span className="var-tag">Size: {item.size}</span>
                      <span className="var-tag">Color: {item.color}</span>
                    </div>
                    <span className="cart-unit-price">{money(item.price)} each</span>
                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.key)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-qty-col">
                  <div className="qty-picker">
                    <button
                      type="button"
                      onClick={() => setQty(item.key, item.qty - 1)}
                      aria-label="Reduce quantity"
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.key, item.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-subtotal-col text-right">
                  <strong>{money(item.price * item.qty)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Aside */}
        <aside className="cart-summary-column">
          <div className="summary-card">
            <h3>Order Summary</h3>

            {/* Promo Code Box */}
            <div className="summary-promo-wrap">
              {discountCode ? (
                <div className="promo-active-pill">
                  <span>Coupon <strong>{discountCode}</strong> applied</span>
                  <button type="button" onClick={removePromoCode} className="btn-remove-promo">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="summary-promo-form">
                  <input
                    type="text"
                    placeholder="Promo code (try URBAN15)"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-sm btn-primary">Apply</button>
                </form>
              )}
              {promoError && <p className="promo-error-note">{promoError}</p>}
            </div>

            <div className="summary-line-breakdown">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-line line-discount">
                  <span>Discount ({discountCode})</span>
                  <span>-{money(discountAmount)}</span>
                </div>
              )}
              <div className="summary-line">
                <span>Estimated Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : money(shippingFee)}</span>
              </div>
              <hr className="summary-sep" />
              <div className="summary-line line-total">
                <span>Estimated Total</span>
                <span className="final-total">{money(total)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block btn-lg checkout-cta"
              onClick={() => nav('/checkout')}
            >
              Proceed to Checkout →
            </button>

            <div className="summary-trust-badges">
              <div className="trust-badge">
                <span className="badge-ico">🔒</span>
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="trust-badge">
                <span className="badge-ico">🌿</span>
                <span>Carbon Neutral Free Delivery</span>
              </div>
              <div className="trust-badge">
                <span className="badge-ico">💬</span>
                <span>Dedicated WhatsApp Concierge</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
