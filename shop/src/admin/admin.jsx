import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { useStore } from '../context/store.jsx';
import { money, config } from '../config.js';

const blankProduct = {
  name: '',
  description: '',
  gender: 'women',
  category: '',
  price: '',
  originalPrice: '',
  sizes: 'XS, S, M, L, XL',
  colors: 'black, white',
  soldout: '',
  images: [],
  isNew: true
};

const parseCommaList = (str) => {
  if (Array.isArray(str)) return str;
  return (str || '').split(',').map(x => x.trim()).filter(Boolean);
};

// Process an uploaded file: uploads to Supabase storage if available,
// or creates an optimized base64 Data URL so images display immediately anywhere.
async function processImageFile(file) {
  // If Supabase is connected, attempt direct bucket upload
  if (supabase) {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(cleanFileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (!uploadError) {
        const { data } = supabase.storage.from('products').getPublicUrl(cleanFileName);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to local optimized data URL:', err);
    }
  }

  // Optimized client-side image compression fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const { user, logout, products, orders, addProduct, updateProduct, deleteProduct, addToast } = useStore();
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders'
  const [session, setSession] = useState(undefined);

  // Set page title & robots tag
  useEffect(() => {
    document.title = 'Studio Admin | ' + config.storeName;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  // Check Supabase session or context user
  useEffect(() => {
    if (user?.role === 'admin') {
      setSession(user);
      return;
    }

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setSession(data.session);
        } else {
          setSession(user?.role === 'admin' ? user : null);
        }
      }).catch(() => {
        setSession(user?.role === 'admin' ? user : null);
      });
    } else {
      setSession(user?.role === 'admin' ? user : null);
    }
  }, [user]);

  // If loading session
  if (session === undefined) {
    return (
      <main className="admin-loading-screen">
        <p>Loading Admin Workspace…</p>
      </main>
    );
  }

  // If not authenticated as admin, show elegant Admin Login
  if (!session || (user && user.role !== 'admin' && !session.user?.email?.includes('admin'))) {
    return <AdminLogin onLoginSuccess={(u) => setSession(u)} />;
  }

  const handleAdminLogout = async () => {
    await logout();
    setSession(null);
    nav('/');
  };

  return (
    <main className="admin-workspace-wrap">
      {/* Admin Top Navigation */}
      <header className="admin-navbar">
        <div className="admin-nav-brand">
          <Link to="/" className="admin-brand-link">
            {config.storeName} <span>STUDIO CONTROL</span>
          </Link>
          <span className="admin-env-badge">
            {isSupabaseConfigured ? '🟢 Supabase Cloud' : '🟡 Standalone Mode'}
          </span>
        </div>

        <div className="admin-nav-actions">
          <Link to="/" className="btn btn-sm btn-ghost">
            ← View Live Store
          </Link>
          <button onClick={handleAdminLogout} className="btn btn-sm btn-outline">
            Sign Out
          </button>
        </div>
      </header>

      <div className="admin-body-container">
        {/* KPI Metrics Dashboard Bar */}
        <section className="admin-metrics-row">
          <div className="metric-card">
            <span className="metric-label">Total Products</span>
            <strong className="metric-val">{products.length}</strong>
            <span className="metric-hint">Active in store</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Customer Orders</span>
            <strong className="metric-val">{orders.length}</strong>
            <span className="metric-hint">
              {orders.filter(o => o.status === 'pending').length} pending dispatch
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Gross Order Value</span>
            <strong className="metric-val">
              {money(orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0))}
            </strong>
            <span className="metric-hint">Across all recorded orders</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Avg. Order Value</span>
            <strong className="metric-val">
              {money(orders.length ? (orders.reduce((s, o) => s + (Number(o.total) || 0), 0) / orders.length) : 0)}
            </strong>
            <span className="metric-hint">Per customer basket</span>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="admin-tab-bar">
          <button
            className={`admin-tab-pill ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            👕 Products & Catalogue ({products.length})
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Customer Orders ({orders.length})
          </button>
        </div>

        {activeTab === 'products' ? (
          <AdminProductsSection
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            addToast={addToast}
          />
        ) : (
          <AdminOrdersSection orders={orders} />
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// Admin Login Sub-component
// -------------------------------------------------------------
function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useStore();

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setBusy(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-screen">
      <div className="admin-login-box">
        <div className="admin-login-header">
          <span className="admin-security-tag">🔐 RESTRICTED PORTAL</span>
          <h1>Admin Access</h1>
          <p>Enter your authorized credentials to manage products and orders.</p>
        </div>

        {errorMsg && <div className="admin-alert-error">{errorMsg}</div>}

        <form onSubmit={handleAdminSignIn} className="admin-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Authenticating…' : 'Enter Admin Panel'}
          </button>
        </form>

        <div className="admin-back-link">
          <Link to="/">← Return to Public Store</Link>
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// Admin Products Management Section with Direct File Upload
// -------------------------------------------------------------
function AdminProductsSection({ products, addProduct, updateProduct, deleteProduct, addToast }) {
  const [formData, setFormData] = useState(blankProduct);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Image Upload States
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    const existingImages = Array.isArray(p.images) ? [...p.images] : (p.images ? [p.images] : []);
    setFormData({
      name: p.name || '',
      description: p.description || '',
      gender: p.gender || 'women',
      category: p.category || '',
      price: p.price || '',
      originalPrice: p.originalPrice || '',
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || ''),
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || ''),
      soldout: Array.isArray(p.soldout) ? p.soldout.join(', ') : (p.soldout || ''),
      images: existingImages,
      isNew: Boolean(p.isNew)
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(blankProduct);
    setIsFormOpen(false);
    setUrlInput('');
    setShowUrlField(false);
  };

  // Multiple File Upload Handler
  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const fileList = Array.from(files);
      const uploadPromises = fileList.map(f => processImageFile(f));
      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      addToast(`Attached ${uploadedUrls.length} image(s) to product!`, 'success');
    } catch (err) {
      addToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Add Image via direct URL
  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, urlInput.trim()]
    }));
    setUrlInput('');
    addToast('Image URL added!', 'info');
  };

  // Remove individual image
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Set image as primary cover (move to position 0)
  const handleSetPrimary = (index) => {
    setFormData(prev => {
      const selected = prev.images[index];
      const others = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: [selected, ...others]
      };
    });
    addToast('Set as primary cover image!', 'info');
  };

  // Shift image order
  const handleMove = (index, delta) => {
    setFormData(prev => {
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const reordered = [...prev.images];
      const temp = reordered[index];
      reordered[index] = reordered[targetIndex];
      reordered[targetIndex] = temp;
      return { ...prev, images: reordered };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setBusy(true);

    let finalImages = [...formData.images];
    if (finalImages.length === 0) {
      finalImages.push('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80');
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      gender: formData.gender,
      category: formData.category.trim().toLowerCase(),
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
      sizes: parseCommaList(formData.sizes),
      colors: parseCommaList(formData.colors),
      soldout: parseCommaList(formData.soldout),
      images: finalImages,
      isNew: formData.isNew
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }
      cancelEdit();
    } catch (err) {
      addToast('Failed to save product: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePriceBlur = async (p, newPrice) => {
    const val = Number(newPrice);
    if (!isNaN(val) && val !== p.price && val > 0) {
      await updateProduct(p.id, { price: val });
    }
  };

  const handleDelete = async (p) => {
    if (window.confirm(`Permanently remove "${p.name}" from the store catalogue?`)) {
      await deleteProduct(p.id);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.gender?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="admin-products-view">
      <div className="section-toolbar-row">
        <div className="search-wrap">
          <input
            type="search"
            placeholder="Search products by title or category…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (isFormOpen && !editingId) {
              setIsFormOpen(false);
            } else {
              setEditingId(null);
              setFormData(blankProduct);
              setIsFormOpen(true);
            }
          }}
        >
          {isFormOpen && !editingId ? 'Close Form' : '+ Add New Product'}
        </button>
      </div>

      {/* Product Form Modal / Collapsible */}
      {isFormOpen && (
        <div className="admin-product-form-box">
          <div className="form-head">
            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <button type="button" onClick={cancelEdit} className="btn-close-form">✕</button>
          </div>

          <form onSubmit={handleSaveProduct} className="admin-grid-form">
            <div className="form-group full-span">
              <label>Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Linen Summer Dress"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </div>

            <div className="form-group full-span">
              <label>Description</label>
              <textarea
                rows="2"
                placeholder="Details on silhouette, fabric weave, hardware..."
                value={formData.description}
                onChange={handleInputChange('description')}
              />
            </div>

            <div className="form-group">
              <label>Gender Department *</label>
              <select value={formData.gender} onChange={handleInputChange('gender')}>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                placeholder="dresses, tops, jackets, trousers…"
                value={formData.category}
                onChange={handleInputChange('category')}
                required
              />
            </div>

            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="48.00"
                value={formData.price}
                onChange={handleInputChange('price')}
                required
              />
            </div>

            <div className="form-group">
              <label>Original Price ($) [Optional]</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="65.00"
                value={formData.originalPrice}
                onChange={handleInputChange('originalPrice')}
              />
            </div>

            <div className="form-group">
              <label>Sizes (Comma-separated)</label>
              <input
                type="text"
                placeholder="XS, S, M, L, XL"
                value={formData.sizes}
                onChange={handleInputChange('sizes')}
              />
            </div>

            <div className="form-group">
              <label>Colors (Comma-separated)</label>
              <input
                type="text"
                placeholder="oatmeal, noir, sage"
                value={formData.colors}
                onChange={handleInputChange('colors')}
              />
            </div>

            <div className="form-group">
              <label>Sold-out Sizes (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. XS"
                value={formData.soldout}
                onChange={handleInputChange('soldout')}
              />
            </div>

            <div className="form-group">
              <label>Badge</label>
              <select
                value={formData.isNew ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, isNew: e.target.value === 'true' })}
              >
                <option value="true">Mark as 'New In'</option>
                <option value="false">Standard Item</option>
              </select>
            </div>

            {/* =========================================================
                RICH DIRECT IMAGE UPLOAD & PREVIEW SECTION
               ========================================================= */}
            <div className="form-group full-span image-upload-section">
              <div className="image-section-header">
                <div>
                  <label className="section-title-label">📸 Product Photos</label>
                  <p className="upload-section-subtitle">
                    Upload photos directly from your computer or phone. You can upload multiple angles (front, back, lifestyle).
                  </p>
                </div>
                <button
                  type="button"
                  className="link-toggle-url"
                  onClick={() => setShowUrlField(!showUrlField)}
                >
                  {showUrlField ? 'Hide URL paste' : '+ Or paste image URL'}
                </button>
              </div>

              {/* Drag and Drop Upload Area */}
              <div
                className={`admin-upload-dropzone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFilesUpload(e.target.files)}
                />

                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    {uploading ? '⏳' : '📤'}
                  </div>
                  {uploading ? (
                    <div className="uploading-msg">
                      <strong>Processing & Uploading Images…</strong>
                      <span>Optimizing high-res photographs for instant web delivery.</span>
                    </div>
                  ) : (
                    <div className="dropzone-text">
                      <strong>Click to Browse Photos or Drag & Drop Here</strong>
                      <span>Supports PNG, JPG, JPEG, and WebP (Pick multiple at once)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional URL Input */}
              {showUrlField && (
                <div className="admin-url-input-bar">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                  />
                  <button type="button" className="btn btn-sm btn-ghost" onClick={handleAddUrl}>
                    Attach URL
                  </button>
                </div>
              )}

              {/* Uploaded Images Preview Gallery */}
              {formData.images && formData.images.length > 0 && (
                <div className="attached-images-container">
                  <span className="attached-count-label">
                    Attached Photographs ({formData.images.length}) • Drag or click arrows to reorder
                  </span>

                  <div className="admin-images-grid">
                    {formData.images.map((imgSrc, idx) => (
                      <div key={idx} className={`image-preview-card ${idx === 0 ? 'is-primary-cover' : ''}`}>
                        <div className="preview-img-wrap">
                          <img src={imgSrc} alt="" className="preview-thumb-img" />
                          {idx === 0 && (
                            <span className="badge-primary-cover">★ Primary Cover</span>
                          )}
                        </div>

                        <div className="preview-card-controls">
                          {idx !== 0 && (
                            <button
                              type="button"
                              className="btn-card-ctrl set-cover"
                              onClick={() => handleSetPrimary(idx)}
                              title="Make this the main product photo"
                            >
                              Set Cover
                            </button>
                          )}
                          <div className="reorder-arrows">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, -1)}
                              className="btn-arrow"
                              title="Move left"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              disabled={idx === formData.images.length - 1}
                              onClick={() => handleMove(idx, 1)}
                              className="btn-arrow"
                              title="Move right"
                            >
                              ▶
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn-card-ctrl remove"
                            onClick={() => handleRemoveImage(idx)}
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions full-span">
              <button type="submit" className="btn btn-primary" disabled={busy || uploading}>
                {busy ? 'Saving…' : editingId ? 'Update Product' : 'Publish Product'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Department</th>
              <th>Category</th>
              <th>Price</th>
              <th>Photos</th>
              <th>Sizes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="table-img-cell">
                  <img src={p.images?.[0]} alt="" className="table-thumb" />
                </td>
                <td className="table-name-cell">
                  <strong>{p.name}</strong>
                  {p.isNew && <span className="mini-badge-new">New</span>}
                </td>
                <td>
                  <span className="dept-tag">{p.gender}</span>
                </td>
                <td>{p.category}</td>
                <td>
                  <div className="inline-price-box">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={p.price}
                      key={p.price}
                      onBlur={e => handlePriceBlur(p, e.target.value)}
                      className="inline-price-input"
                      title="Click to edit price inline"
                    />
                  </div>
                </td>
                <td>
                  <span className="photo-count-pill">
                    📸 {Array.isArray(p.images) ? p.images.length : (p.images ? 1 : 0)}
                  </span>
                </td>
                <td className="sizes-cell">
                  {(p.sizes || []).join(', ')}
                </td>
                <td className="actions-cell">
                  <button className="btn-table-action" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn-table-action btn-danger" onClick={() => handleDelete(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// Admin Orders Management Section
// -------------------------------------------------------------
function AdminOrdersSection({ orders }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [ordersList, setOrdersList] = useState(orders);

  useEffect(() => {
    setOrdersList(orders);
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (supabase) {
      try {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      } catch (e) {
        console.warn(e);
      }
    }
    try {
      const stored = JSON.parse(localStorage.getItem('urban_thread_orders_v2')) || [];
      localStorage.setItem('urban_thread_orders_v2', JSON.stringify(
        stored.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      ));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Delete this order record permanently?')) {
      setOrdersList(prev => prev.filter(o => o.id !== orderId));
      if (supabase) {
        try {
          await supabase.from('orders').delete().eq('id', orderId);
        } catch (e) {
          console.warn(e);
        }
      }
      try {
        const stored = JSON.parse(localStorage.getItem('urban_thread_orders_v2')) || [];
        localStorage.setItem('urban_thread_orders_v2', JSON.stringify(
          stored.filter(o => o.id !== orderId)
        ));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const filtered = ordersList.filter(o => {
    if (filterStatus === 'all') return true;
    return (o.status || 'pending') === filterStatus;
  });

  return (
    <section className="admin-orders-view">
      <div className="orders-filter-row">
        <div className="status-chips">
          {['all', 'pending', 'contacted', 'paid', 'delivered'].map(st => (
            <button
              key={st}
              className={`status-chip-btn ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)} (
              {st === 'all' ? ordersList.length : ordersList.filter(o => (o.status || 'pending') === st).length}
              )
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-orders-note">
          <p>No orders found for the "{filterStatus}" status.</p>
        </div>
      ) : (
        <div className="admin-orders-stack">
          {filtered.map(order => (
            <div key={order.id} className="admin-order-card">
              <div className="order-head-bar">
                <div className="order-meta-info">
                  <strong className="order-id">#{order.id}</strong>
                  <span className="order-customer">{order.customer_name}</span>
                  <span className="order-timestamp">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="order-status-control">
                  <select
                    value={order.status || 'pending'}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    className={`status-select status-color-${order.status || 'pending'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                  </select>

                  <button
                    className="btn-trash-order"
                    onClick={() => handleDeleteOrder(order.id)}
                    title="Delete order record"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="order-contact-details">
                <span>📞 Phone: <strong>{order.phone}</strong></span>
                <span>📍 State: <strong>{order.state}</strong></span>
                <span>🏠 Address: <strong>{order.location}</strong></span>
                {order.customer_email && <span>✉️ Email: <strong>{order.customer_email}</strong></span>}
              </div>

              <div className="order-items-summary">
                <ul>
                  {(order.items || []).map((item, idx) => (
                    <li key={idx}>
                      {item.qty} × {item.name} [{item.size}, {item.color}] — {money((item.price || 0) * (item.qty || 1))}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-foot-bar">
                <span className="order-grand-total">
                  Total Payable: <strong>{money(order.total)}</strong>
                </span>

                <div className="order-actions-right">
                  <a
                    href={`https://wa.me/${order.phone?.replace(/\D/g, '') || config.whatsapp}?text=${encodeURIComponent(`Hello ${order.customer_name}, regarding your Urban Thread order #${order.id}...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-wa-direct"
                  >
                    💬 Message Customer on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
