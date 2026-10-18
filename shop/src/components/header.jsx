import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { config } from '../config.js';

export default function Header() {
  const { count, wishlistCount, fuse, user, logout, setIsCartOpen } = useStore();
  const nav = useNavigate();
  const location = useLocation();
  const taps = useRef([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
  }, [location.pathname]);

  const searchSuggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    return fuse.search(debouncedQuery, { limit: 5 }).map(r => r.item);
  }, [debouncedQuery, fuse]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      nav(config.adminPath);
    } else {
      nav('/');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav('/shop?q=' + encodeURIComponent(searchQuery.trim()));
      setSearchQuery('');
      setDebouncedQuery('');
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    nav('/');
  };

  return (
    <header className="site-header">
      {/* Main Navigation Bar */}
      <div className="header-main">
        <div className="header-container">
          {/* Mobile Hamburger Button */}
          <button
            className="mobile-menu-trigger"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="bar-icon" />
            <span className="bar-icon" />
            <span className="bar-icon" />
          </button>

          {/* Brand Logo */}
          <Link to="/" className="site-logo" onClick={handleLogoClick}>
            <span className="logo-main">{config.storeName}</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" aria-label="Primary Navigation">
            <Link to="/shop?gender=women" className="nav-link">Women</Link>
            <Link to="/shop?gender=men" className="nav-link">Men</Link>
            <Link to="/shop" className="nav-link">All Clothes</Link>
          </nav>

          {/* Search Bar with Autocomplete */}
          <div className="header-search-wrap">
            <form onSubmit={handleSearchSubmit} className="search-form" role="search">
              <span className="search-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search clothes…"
                aria-label="Search clothes"
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                >
                  ×
                </button>
              )}
            </form>

            {/* Instant search autocomplete dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="search-autocomplete-panel">
                <div className="search-suggestions-header">
                  <span>Suggested Clothes ({searchSuggestions.length})</span>
                </div>
                <div className="search-suggestions-list">
                  {searchSuggestions.map(item => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      className="suggestion-row"
                      onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                    >
                      <img src={item.images?.[0]} alt="" className="suggestion-img" />
                      <div className="suggestion-info">
                        <strong className="suggestion-title">{item.name}</strong>
                        <span className="suggestion-meta">{item.category} • ${item.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  to={`/shop?q=${encodeURIComponent(debouncedQuery)}`}
                  className="search-view-all"
                  onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                >
                  View all results for "{debouncedQuery}" →
                </Link>
              </div>
            )}
          </div>

          {/* Right Action Icons: Wishlist, Account, Bag */}
          <div className="header-actions">
            {/* Wishlist Link */}
            <Link to="/account" className="action-icon-btn" aria-label="Saved Wishlist" title="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="action-badge badge-wishlist">{wishlistCount}</span>
              )}
            </Link>

            {/* Account / Auth dropdown */}
            <div className="account-dropdown-wrap" ref={dropdownRef}>
              {user ? (
                <button
                  type="button"
                  className="user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                >
                  <span className="user-avatar-mini">
                    {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="user-name-short">{user.name?.split(' ')[0] || 'Account'}</span>
                  <span className="chevron-mini">▾</span>
                </button>
              ) : (
                <Link to="/login" className="btn-signin-nav">
                  <span className="icon-user-svg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span>Sign In</span>
                </Link>
              )}

              {/* User Dropdown Menu */}
              {user && userDropdownOpen && (
                <div className="account-menu-popover">
                  <div className="popover-user-info">
                    <strong>{user.name}</strong>
                    <span className="popover-email">{user.email}</span>
                  </div>

                  <hr className="popover-divider" />

                  <Link to="/account" className="popover-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>👤 My Profile & Orders</span>
                  </Link>

                  <Link to="/account" className="popover-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>♥ Saved Wishlist ({wishlistCount})</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link to={config.adminPath} className="popover-item popover-admin-highlight" onClick={() => setUserDropdownOpen(false)}>
                      <span>⚡ Admin Dashboard</span>
                    </Link>
                  )}

                  <hr className="popover-divider" />

                  <button type="button" className="popover-item popover-logout" onClick={handleLogout}>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Bag Trigger (Opens Cart Drawer) */}
            <button
              type="button"
              className="action-icon-btn bag-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping bag with ${count} items`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="action-badge badge-cart">{count}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <span className="drawer-brand">{config.storeName}</span>
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-nav-links">
          <Link to="/shop?gender=women" onClick={() => setMobileMenuOpen(false)}>Women</Link>
          <Link to="/shop?gender=men" onClick={() => setMobileMenuOpen(false)}>Men</Link>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>All Clothes</Link>
        </div>

        <div className="mobile-auth-section">
          {user ? (
            <div className="mobile-user-card">
              <p className="mobile-user-greeting">Signed in as <strong>{user.name}</strong></p>
              <div className="mobile-btn-stack">
                <Link to="/account" className="btn btn-sm btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                  My Account & Orders
                </Link>
                {user.role === 'admin' && (
                  <Link to={config.adminPath} className="btn btn-sm btn-admin-accent" onClick={() => setMobileMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-guest-card">
              <p>Sign in to view your orders and saved wishlist.</p>
              <Link to="/login" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                Sign In / Register
              </Link>
            </div>
          )}
        </div>
      </div>
      {mobileMenuOpen && <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />}
    </header>
  );
}
