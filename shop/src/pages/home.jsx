import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { Grid } from '../components/productcard.jsx';

export default function Home() {
  const { products, loading, addToast } = useStore();
  const [filterTab, setFilterTab] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const displayedProducts = products
    .filter(p => {
      if (filterTab === 'women') return p.gender === 'women';
      if (filterTab === 'men') return p.gender === 'men';
      return true;
    })
    .slice(0, 8);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      addToast('Please enter a valid email address', 'error');
      return;
    }
    setNewsletterSuccess(true);
    addToast('Welcome! Your discount code is URBAN15', 'success');
  };

  return (
    <main className="home-page">
      {/* Clean Hero Section */}
      <section className="hero-editorial">
        <div className="hero-backdrop">
          <img
            src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1920&q=85"
            alt="Clothing store collection"
            className="hero-image"
          />
          <div className="hero-gradient-overlay" />
        </div>

        <div className="hero-content-wrap">
          <h1 className="hero-title">
            Everyday Style for <br />
            <em>Women & Men</em>
          </h1>
          <p className="hero-description">
            Quality clothing, comfortable everyday fits, and timeless essentials.
          </p>
          <div className="hero-actions">
            <Link to="/shop?gender=women" className="btn btn-hero btn-hero-primary">
              Shop Women
            </Link>
            <Link to="/shop?gender=men" className="btn btn-hero btn-hero-secondary">
              Shop Men
            </Link>
            <Link to="/shop" className="btn btn-hero btn-hero-outline">
              All Clothes
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Value Strip */}
      <section className="value-props-strip" aria-label="Store Benefits">
        <div className="value-props-container">
          <div className="value-prop-card">
            <span className="prop-icon">📦</span>
            <div className="prop-text">
              <h4>Fast Delivery</h4>
              <p>Complimentary delivery on orders over $75</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">✨</span>
            <div className="prop-text">
              <h4>Quality Fabrics</h4>
              <p>Comfortable, breathable, and made to last</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">🔄</span>
            <div className="prop-text">
              <h4>Easy Returns</h4>
              <p>30 days to exchange or return without hassle</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">💬</span>
            <div className="prop-text">
              <h4>Customer Support</h4>
              <p>Direct assistance on WhatsApp anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Women & Men Categories */}
      <section className="featured-categories-section">
        <div className="section-head-center">
          <span className="section-eyebrow">SHOP BY DEPARTMENT</span>
          <h2>Women & Men Clothing</h2>
        </div>

        <div className="categories-grid">
          {/* Women */}
          <Link to="/shop?gender=women" className="category-tile tile-large">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"
              alt="Women's clothing"
              loading="lazy"
            />
            <div className="tile-glass-overlay">
              <span className="tile-tag">COLLECTION</span>
              <h3>Women's Clothing</h3>
              <span className="tile-cta">Shop Women →</span>
            </div>
          </Link>

          {/* Men */}
          <Link to="/shop?gender=men" className="category-tile tile-large">
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80"
              alt="Men's clothing"
              loading="lazy"
            />
            <div className="tile-glass-overlay">
              <span className="tile-tag">COLLECTION</span>
              <h3>Men's Clothing</h3>
              <span className="tile-cta">Shop Men →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* New Arrivals with Clean Filter Tabs */}
      <section className="arrivals-section">
        <div className="arrivals-header">
          <div>
            <span className="section-eyebrow">FEATURED PRODUCTS</span>
            <h2>New Arrivals</h2>
          </div>

          <div className="filter-pill-group">
            <button
              className={`pill-btn ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              All
            </button>
            <button
              className={`pill-btn ${filterTab === 'women' ? 'active' : ''}`}
              onClick={() => setFilterTab('women')}
            >
              Women
            </button>
            <button
              className={`pill-btn ${filterTab === 'men' ? 'active' : ''}`}
              onClick={() => setFilterTab('men')}
            >
              Men
            </button>
          </div>
        </div>

        <Grid items={displayedProducts} loading={loading} />

        <div className="arrivals-bottom-cta">
          <Link to="/shop" className="btn btn-outline btn-lg">
            View All Clothes ({products.length} Items)
          </Link>
        </div>
      </section>

      {/* Newsletter Discount Banner */}
      <section className="newsletter-banner">
        <div className="newsletter-box">
          <span className="newsletter-tag">SPECIAL OFFER</span>
          <h2>Get 15% Off Your Order</h2>
          <p>
            Sign up with your email to receive an instant 15% discount code for your next order.
          </p>

          {newsletterSuccess ? (
            <div className="newsletter-success-box">
              <span className="check-circle">✓</span>
              <div>
                <strong>You're subscribed!</strong>
                <p>Use coupon code <strong>URBAN15</strong> at checkout for 15% off.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                Get 15% Off
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
