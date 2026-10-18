import { Link } from 'react-router-dom';
import { config } from '../config.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top-wrap">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand-title">
              {config.storeName}
            </Link>
            <p className="footer-brand-desc">
              Everyday style and quality clothing for women and men.
            </p>
            <div className="footer-social-links">
              <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="social-pill">
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div className="footer-col">
            <h4>Clothing</h4>
            <ul className="footer-link-list">
              <li><Link to="/shop?gender=women">Women</Link></li>
              <li><Link to="/shop?gender=men">Men</Link></li>
              <li><Link to="/shop">All Clothes</Link></li>
              <li><Link to="/shop?category=jackets">Jackets & Coats</Link></li>
              <li><Link to="/shop?category=shoes">Shoes</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul className="footer-link-list">
              <li><Link to="/checkout">Delivery Information</Link></li>
              <li><Link to="/account">Track Order</Link></li>
              <li><a href={`https://wa.me/${config.whatsapp}?text=Hello%20Urban%20Thread,%20I%20have%20an%20inquiry`} target="_blank" rel="noreferrer">WhatsApp Chat</a></li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-col">
            <h4>Account</h4>
            <ul className="footer-link-list">
              <li><Link to="/login">Sign In / Register</Link></li>
              <li><Link to="/account">My Orders</Link></li>
              <li><Link to="/account">Wishlist</Link></li>
              <li><Link to={config.adminPath}>Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom-wrap">
        <div className="footer-bottom-content">
          <p>© {new Date().getFullYear()} {config.storeName}. All rights reserved.</p>
          <div className="footer-payment-icons">
            <span className="pay-badge">WhatsApp Orders</span>
            <span className="pay-badge">Secure Payment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
