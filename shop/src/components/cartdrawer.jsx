import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { money } from '../config.js';

export default function CartDrawer() {
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
    isCartOpen,
    setIsCartOpen,
    setQty,
    removeFromCart
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const nav = useNavigate();

  if (!isCartOpen) return null;

  const freeShippingProgress = Math.min(100, Math.round((subtotal / shippingThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, shippingThreshold - subtotal);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoInput('');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    nav('/checkout');
  };

  return (
    <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <aside
        className="drawer-panel"
        onClick={e => e.stopPropagation()}
        aria-label="Shopping Cart Drawer"
      >
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <h3>Your Shopping Bag</h3>
            <span className="drawer-badge">{count} {count === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="shipping-meter">
          {subtotal >= shippingThreshold ? (
            <p className="shipping-congrats">🎉 You've unlocked <strong>Complimentary Express Delivery</strong>!</p>
          ) : (
            <p className="shipping-prompt">
              Add <strong>{money(amountNeededForFreeShipping)}</strong> more to get <strong>Free Express Shipping</strong>!
            </p>
          )}
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="drawer-empty">
            <div className="empty-icon">🛍️</div>
            <h4>Your bag is empty</h4>
            <p>Discover our clothes for women and men.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsCartOpen(false);
                nav('/shop');
              }}
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {cart.map(item => (
                <div key={item.key} className="drawer-item">
                  <Link
                    to={`/product/${item.id}`}
                    onClick={() => setIsCartOpen(false)}
                    className="drawer-item-img-link"
                  >
                    <img src={item.image} alt={item.name} className="drawer-item-img" />
                  </Link>

                  <div className="drawer-item-details">
                    <Link
                      to={`/product/${item.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="drawer-item-title"
                    >
                      {item.name}
                    </Link>

                    <div className="drawer-item-meta">
                      <span className="meta-pill">Size: {item.size}</span>
                      <span className="meta-pill">Color: {item.color}</span>
                    </div>

                    <div className="drawer-item-row">
                      <div className="qty-picker">
                        <button
                          type="button"
                          onClick={() => setQty(item.key, item.qty - 1)}
                          aria-label="Decrease quantity"
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

                      <span className="drawer-item-price">{money(item.price * item.qty)}</span>
                    </div>
                  </div>

                  <button
                    className="drawer-item-remove"
                    onClick={() => removeFromCart(item.key)}
                    aria-label={`Remove ${item.name}`}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="drawer-footer">
              {/* Promo Code Accordion/Form */}
              <div className="drawer-promo-box">
                {discountCode ? (
                  <div className="promo-applied-badge">
                    <span>Coupon <strong>{discountCode}</strong> applied ({discountAmount > 0 ? `-${money(discountAmount)}` : ''})</span>
                    <button className="link-mini" onClick={removePromoCode}>Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="promo-form">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. URBAN15)"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-sm">Apply</button>
                  </form>
                )}
                {promoError && <p className="promo-err-msg">{promoError}</p>}
              </div>

              {/* Order Calculations */}
              <div className="drawer-calc">
                <div className="calc-row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="calc-row discount-row">
                    <span>Discount</span>
                    <span>-{money(discountAmount)}</span>
                  </div>
                )}
                <div className="calc-row">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : money(shippingFee)}</span>
                </div>
                <div className="calc-row calc-total">
                  <span>Estimated Total</span>
                  <span className="total-amount">{money(total)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-block checkout-action-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout • {money(total)}
              </button>

              <div className="drawer-footer-links">
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="drawer-view-cart-link"
                >
                  View Full Bag Details
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
