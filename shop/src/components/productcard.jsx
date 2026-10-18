import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../config.js';
import { useStore } from '../context/store.jsx';

export default function ProductCard({ p }) {
  const { toggleWishlist, isWishlisted, addToCart } = useStore();
  const [hovered, setHovered] = useState(false);
  const wish = isWishlisted(p.id);

  const displayImage = hovered && p.images && p.images[1] ? p.images[1] : (p.images?.[0] || '');

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const size = p.sizes?.[0] || 'M';
    const color = p.colors?.[0] || 'Standard';
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.images?.[0],
      size,
      color,
      qty: 1
    }, true);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id);
  };

  return (
    <article
      className="product-card group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-media">
        <Link to={`/product/${p.id}`} className="card-image-wrap">
          <img
            src={displayImage}
            alt={p.name}
            loading="lazy"
            className="card-image"
          />
        </Link>

        {/* Badges */}
        <div className="card-badges">
          {p.isNew && <span className="badge-pill badge-new">New In</span>}
          {p.originalPrice && p.originalPrice > p.price && (
            <span className="badge-pill badge-sale">Save {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn ${wish ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={wish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wish ? '#E11D48' : 'none'} stroke={wish ? '#E11D48' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick Add Overlay */}
        <button
          className="quick-add-overlay-btn"
          onClick={handleQuickAdd}
          aria-label={`Quick add ${p.name}`}
        >
          + Quick Add
        </button>
      </div>

      <div className="card-info">
        <div className="card-meta">
          <span className="card-cat">{p.category}</span>
          {p.rating && (
            <span className="card-rating">
              ★ {Number(p.rating).toFixed(1)} <span className="rating-count">({p.reviewCount || 12})</span>
            </span>
          )}
        </div>

        <h3 className="card-title">
          <Link to={`/product/${p.id}`}>{p.name}</Link>
        </h3>

        {/* Color preview dots */}
        {p.colors && p.colors.length > 0 && (
          <div className="card-color-swatches" aria-label="Available colors">
            {p.colors.slice(0, 4).map(c => (
              <span
                key={c}
                className="color-dot"
                title={c}
                style={{ backgroundColor: getColorHex(c) }}
              />
            ))}
            {p.colors.length > 4 && <span className="color-more">+{p.colors.length - 4}</span>}
          </div>
        )}

        <div className="card-pricing">
          <span className="card-price">{money(p.price)}</span>
          {p.originalPrice && p.originalPrice > p.price && (
            <span className="card-original-price">{money(p.originalPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

// Color helper for preview dots
function getColorHex(colorName) {
  const map = {
    white: '#fcfcfc',
    'chalk-white': '#f5f5f0',
    black: '#1a1a1a',
    noir: '#111111',
    'faded-black': '#2d2d2d',
    beige: '#e6ded3',
    oatmeal: '#dfd7cc',
    taupe: '#b3a89b',
    sand: '#d2c29d',
    camel: '#c19a6b',
    cognac: '#9a4e2b',
    blue: '#2b5876',
    'sky-blue': '#a0c4e2',
    midnight: '#192841',
    navy: '#0f172a',
    indigo: '#2e3856',
    gray: '#8a8d91',
    charcoal: '#374151',
    slate: '#475569',
    heather: '#9ca3af',
    rose: '#e5b8b8',
    sage: '#9caf88',
    olive: '#556b2f',
    emerald: '#0f5132',
    champagne: '#f7e7ce',
    houndstooth: '#333333'
  };
  return map[colorName?.toLowerCase()] || '#cbd5e1';
}

export function Grid({ items, loading }) {
  if (loading) {
    return (
      <div className="products-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="product-skeleton">
            <div className="skel-img" />
            <div className="skel-line w-40" />
            <div className="skel-line w-80" />
            <div className="skel-line w-30" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="products-grid">
      {items.map(p => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
