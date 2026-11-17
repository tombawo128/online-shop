import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { Grid } from '../components/productcard.jsx';
import { supabase } from '../lib/supabase.js';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const { products, loading, catalogueError, addToast } = useStore();
  const [filterTab, setFilterTab] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const displayedProducts = products
    .filter(p => {
      if (filterTab === 'women') return p.gender === 'women';
      if (filterTab === 'men') return p.gender === 'men';
      return true;
    })
    .slice(0, 8);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    setNewsletterError('');
    if (!newsletterConsent) {
      setNewsletterError('Please confirm that you agree to receive future store updates.');
      return;
    }
    const email = newsletterEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterError('Enter a valid email address.');
      return;
    }
    if (!supabase) {
      setNewsletterError('Newsletter registration is temporarily unavailable.');
      return;
    }
    setNewsletterBusy(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email });
      if (error && error.code !== '23505') {
        setNewsletterError(error.message || 'Subscription could not be saved. Please try again.');
        return;
      }
      setNewsletterSuccess(true);
      addToast(error?.code === '23505' ? 'This email is already subscribed.' : 'You are now subscribed.', 'success');
    } catch {
      setNewsletterError('Subscription could not be saved. Please try again.');
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <main className="home-page">
      <Helmet>
        <title>Urban Thread | Contemporary Fashion for Women & Men</title>
        <meta name="description" content="Explore contemporary clothing, everyday essentials and new arrivals for women and men at Urban Thread." />
      </Helmet>
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
              <p>Delivery fees shown clearly before you place an order</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">✨</span>
            <div className="prop-text">
              <h4>Product Details</h4>
              <p>Review available sizes, colours and product descriptions</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">🔄</span>
            <div className="prop-text">
              <h4>Order Support</h4>
              <p>Contact the store directly about your order</p>
            </div>
          </div>
          <div className="value-prop-card">
            <span className="prop-icon">💬</span>
            <div className="prop-text">
              <h4>WhatsApp Assistance</h4>
              <p>Arrange order and delivery details with the store</p>
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

        {catalogueError && <p role="alert" className="newsletter-error">{catalogueError}</p>}
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
          <span className="newsletter-tag">THE URBAN THREAD EDIT</span>
          <h2>Stay in the Loop</h2>
          <p>
            Join the subscriber list for future collection announcements. Email campaigns will be enabled when a mailing service is connected.
          </p>

          {newsletterSuccess ? (
            <div className="newsletter-success-box">
              <span className="check-circle">✓</span>
              <div>
                <strong>You’re subscribed!</strong>
                <p>Your email has been saved to the subscriber list. Campaign emails are not yet configured.</p>
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
                maxLength={254}
                autoComplete="email"
              />
              <label className="newsletter-consent">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={event => setNewsletterConsent(event.target.checked)}
                  required
                />
                <span>I agree to receive future Urban Thread store updates by email.</span>
              </label>
              <button type="submit" className="btn btn-primary" disabled={newsletterBusy || !supabase || !newsletterConsent}>
                {newsletterBusy ? 'Subscribing…' : 'Subscribe'}
              </button>
              {newsletterError && <p role="alert" className="newsletter-error">{newsletterError}</p>}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
