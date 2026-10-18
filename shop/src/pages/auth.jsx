import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { config } from '../config.js';

export default function AuthPage({ defaultMode = 'signin' }) {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { user, login, signup, addToast } = useStore();

  const [mode, setMode] = useState(defaultMode); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const redirectPath = searchParams.get('redirect') || '/account';

  // If already logged in, redirect to destination or account
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && redirectPath === '/account') {
        nav(config.adminPath);
      } else {
        nav(redirectPath);
      }
    }
  }, [user, nav, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must contain at least 4 characters.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'signin') {
        const res = await login(email, password);
        if (!res.success) {
          setFormError(res.error || 'Invalid credentials.');
        }
      } else {
        const res = await signup(name, email, password);
        if (!res.success) {
          setFormError(res.error || 'Registration failed.');
        }
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('emma.watson@example.com');
    setPassword('secret123');
    setName('Emma Watson');
    setMode('signin');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@urbanthread.com');
    setPassword('admin2026');
    setName('Store Manager');
    setMode('signin');
  };

  const handleQuickDemoLogin = async (role) => {
    setBusy(true);
    setFormError('');
    if (role === 'admin') {
      await login('admin@urbanthread.com', 'admin2026');
      nav(config.adminPath);
    } else {
      await login('customer@urbanthread.com', 'demo1234');
      nav(redirectPath);
    }
    setBusy(false);
  };

  return (
    <main className="auth-page-container">
      <div className="auth-split-wrapper">
        {/* Left Side: Visual Showcase */}
        <div className="auth-visual-column">
          <div className="auth-visual-overlay" />
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
            alt="Fashion editorial showcase"
            className="auth-visual-bg"
          />
          <div className="auth-visual-content">
            <span className="auth-visual-tag">WELCOME TO URBAN THREAD</span>
            <h2>Quality Clothes for Women & Men</h2>
            <p>
              Create an account or sign in to track your orders, save your wishlist, and enjoy 15% off your first purchase.
            </p>
            <div className="auth-perks">
              <div className="auth-perk-item">
                <span className="perk-check">✓</span>
                <span>Fast delivery on all orders</span>
              </div>
              <div className="auth-perk-item">
                <span className="perk-check">✓</span>
                <span>Save your favorite items to wishlist</span>
              </div>
              <div className="auth-perk-item">
                <span className="perk-check">✓</span>
                <span>Quick checkout with saved delivery address</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="auth-form-column">
          <div className="auth-form-card">
            <div className="auth-header">
              <Link to="/" className="auth-brand-logo">
                {config.storeName}
              </Link>
              <h1 className="auth-heading">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="auth-subheading">
                {mode === 'signin'
                  ? 'Sign in to access your orders, wishlist, and profile.'
                  : 'Register now to receive a 15% discount on your first wardrobe purchase.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setFormError('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setFormError('');
                }}
              >
                Create Account
              </button>
            </div>

            {/* Quick Demo Login Helpers */}
            <div className="demo-login-box">
              <div className="demo-badge-label">⚡ Fast Demo Access:</div>
              <div className="demo-actions">
                <button
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => handleQuickDemoLogin('customer')}
                  disabled={busy}
                >
                  Demo Customer
                </button>
                <button
                  type="button"
                  className="btn-demo-pill admin-pill"
                  onClick={() => handleQuickDemoLogin('admin')}
                  disabled={busy}
                >
                  Demo Admin
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="auth-alert-error" role="alert">
                <span className="alert-icon">!</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-main-form" noValidate>
              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div className="label-with-aside">
                  <label htmlFor="auth-password">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="link-aside"
                      onClick={() => addToast('Demo mode: any 4+ character password or click Fast Demo above.', 'info')}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="password-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-row-remember">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-auth-submit"
                disabled={busy}
              >
                {busy
                  ? 'Processing…'
                  : mode === 'signin'
                  ? 'Sign In to Account'
                  : 'Complete Registration'}
              </button>
            </form>

            <div className="auth-footer-prompt">
              {mode === 'signin' ? (
                <p>
                  New to {config.storeName}?{' '}
                  <button
                    type="button"
                    className="link-switch"
                    onClick={() => {
                      setMode('signup');
                      setFormError('');
                    }}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="link-switch"
                    onClick={() => {
                      setMode('signin');
                      setFormError('');
                    }}
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>

            <div className="auth-back-home">
              <Link to="/">← Return to Store</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
