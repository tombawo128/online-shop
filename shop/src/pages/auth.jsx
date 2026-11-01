import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { config } from '../config.js';

export default function AuthPage({ defaultMode = 'signin' }) {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const {
    user,
    login,
    signup,
    adminCount,
    maxAdmins,
    canRegisterAdmin
  } = useStore();

  const [mode, setMode] = useState(defaultMode); // 'signin' | 'signup' | 'admin-signup'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const redirectPath = searchParams.get('redirect') || '/account';

  // If already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        nav('/admin');
      } else {
        nav(redirectPath);
      }
    }
  }, [user, nav, redirectPath]);

  // If admin creation is no longer available and user was on admin-signup, revert to signin
  useEffect(() => {
    if (!canRegisterAdmin && mode === 'admin-signup') {
      setMode('signin');
    }
  }, [canRegisterAdmin, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must contain at least 4 characters.');
      return;
    }

    if (mode === 'signup' || mode === 'admin-signup') {
      if (!name.trim()) {
        setFormError('Please enter your full name.');
        return;
      }
      if (mode === 'admin-signup') {
        if (!canRegisterAdmin) {
          setFormError(`Maximum limit of ${maxAdmins} admin accounts reached.`);
          return;
        }
        if (confirmPassword && password !== confirmPassword) {
          setFormError('Passwords do not match.');
          return;
        }
      }
    }

    setBusy(true);

    try {
      if (mode === 'signin') {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setFormError(res.error || 'Invalid email or password.');
        } else {
          if (res.user?.role === 'admin') {
            nav('/admin');
          } else {
            nav(redirectPath);
          }
        }
      } else if (mode === 'admin-signup') {
        const res = await signup(name, cleanEmail, password, 'admin');
        if (!res.success) {
          setFormError(res.error || 'Admin registration failed.');
        } else {
          nav('/admin');
        }
      } else {
        const res = await signup(name, cleanEmail, password, 'customer');
        if (!res.success) {
          setFormError(res.error || 'Registration failed.');
        } else {
          nav(redirectPath);
        }
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page-container">
      <div className="auth-split-wrapper">
        {/* Left Editorial Visual Showcase - Monochrome Minimalist */}
        <div className="auth-visual-column">
          <div className="auth-visual-overlay" />
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
            alt="Collection Showcase"
            className="auth-visual-bg"
          />

          <div className="auth-visual-content">
            <span className="auth-visual-tag">{config.storeName.toUpperCase()}</span>
            <h2>Timeless Essentials for Modern Living</h2>
          </div>
        </div>

        {/* Right Form Column - Clean, Professional & Monochrome */}
        <div className="auth-form-column">
          <div className="auth-form-card">
            <div className="auth-top-bar">
              <Link to="/" className="auth-brand-logo">
                {config.storeName}
              </Link>
            </div>

            {/* Heading */}
            <div className="auth-header">
              <h1 className="auth-heading">
                {mode === 'admin-signup'
                  ? 'Register Administrator'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </h1>
            </div>

            {/* Customer Tabs */}
            {mode !== 'admin-signup' && (
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
            )}

            {/* Error Message */}
            {formError && (
              <div className="auth-alert-error" role="alert">
                <span>{formError}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="auth-main-form" noValidate>
              {(mode === 'signup' || mode === 'admin-signup') && (
                <div className="form-group">
                  <label htmlFor="auth-name">
                    {mode === 'admin-signup' ? 'Admin Full Name' : 'Full Name'}
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your full name"
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
                <label htmlFor="auth-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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

              {mode === 'admin-signup' && (
                <div className="form-group">
                  <label htmlFor="auth-confirm-password">Confirm Admin Password</label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-row-remember">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-auth-submit"
                disabled={busy}
              >
                {busy
                  ? 'Please wait…'
                  : mode === 'signin'
                  ? 'Sign In'
                  : mode === 'admin-signup'
                  ? 'Register Administrator'
                  : 'Create Account'}
              </button>
            </form>

            {/* Bottom Navigation Prompts */}
            <div className="auth-footer-prompt">
              {mode === 'admin-signup' ? (
                <p>
                  <button
                    type="button"
                    className="link-switch"
                    onClick={() => {
                      setMode('signin');
                      setFormError('');
                    }}
                  >
                    ← Back to customer sign in
                  </button>
                </p>
              ) : mode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="link-switch"
                    onClick={() => {
                      setMode('signup');
                      setFormError('');
                    }}
                  >
                    Create account
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
                    Sign in
                  </button>
                </p>
              )}

              {/* Admin creation option: ONLY visible when fewer than 2 admin accounts exist */}
              {canRegisterAdmin && mode !== 'admin-signup' && (
                <div className="auth-admin-option-wrap">
                  <button
                    type="button"
                    className="link-admin-subtle"
                    onClick={() => {
                      setMode('admin-signup');
                      setFormError('');
                    }}
                  >
                    Register as Administrator
                  </button>
                </div>
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
