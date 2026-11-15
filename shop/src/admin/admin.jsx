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
  isNew: true,
  inventoryTracking: false
};

const parseCommaList = (str) => {
  if (Array.isArray(str)) return str;
  return (str || '').split(',').map(x => x.trim()).filter(Boolean);
};


async function processImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!file || !allowedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WEBP or AVIF image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Each product image must be 5 MB or smaller.');
  }
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Product image uploads require the connected store database.');
  }

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('products').upload(fileName, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type
  });
  if (error) throw new Error(error.message || 'Image upload failed.');

  const { data } = supabase.storage.from('products').getPublicUrl(fileName);
  if (!data?.publicUrl) throw new Error('The uploaded image URL could not be generated.');
  return data.publicUrl;
}

export default function Admin() {
  const {
    user,
    claimFirstAdmin,
    logout,
    products,
    orders,
    updateOrderStatus,
    inventory,
    saveInventoryVariant,
    reviews,
    moderateReview,
    newsletterSubscribers,
    addProduct,
    updateProduct,
    deleteProduct,
    addToast
  } = useStore();
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'admins'
  const [session, setSession] = useState(undefined);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState('');

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
    if (user?.roleResolved && user?.role === 'admin') {
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

  // Route guard: Ordinary users cannot view or access the admin page
  useEffect(() => {
    if (session !== undefined && (!user || user.roleResolved)) {
      if (!user) nav('/login?redirect=/admin', { replace: true });
    }
  }, [session, user, nav]);

  // If loading session or unauthorized, do not render admin panel
  if (session === undefined || !user || !user.roleResolved) {
    return (
      <main className="admin-loading-screen">
        <p>Verifying your account…</p>
      </main>
    );
  }

  if (user.role !== 'admin') {
    const handleClaimAdmin = async () => {
      setClaimBusy(true);
      setClaimError('');
      const result = await claimFirstAdmin();
      if (!result.success) setClaimError(result.error);
      setClaimBusy(false);
    };
    return (
      <main className="admin-loading-screen">
        <section className="admin-team-section" style={{ maxWidth: 620, margin: '48px auto', padding: 32 }}>
          <span className="section-eyebrow">ONE-TIME STORE SETUP</span>
          <h1>Set up the Urban Threads administrator</h1>
          <p>Only the first verified account can claim administrator access. This setup is enforced by the database and cannot be repeated from the website.</p>
          <p>Signed in as <strong>{user.email}</strong></p>
          {claimError && <p role="alert" className="field-err">{claimError}</p>}
          <button type="button" className="btn btn-primary" onClick={handleClaimAdmin} disabled={claimBusy || !isSupabaseConfigured}>
            {claimBusy ? 'Securing administrator access…' : 'Create the one administrator account'}
          </button>
          {!isSupabaseConfigured && <p role="alert">The live Supabase connection is not configured. Administrator setup is disabled.</p>}
          <p><Link to="/">Return to Urban Threads</Link> · <button type="button" className="link-switch" onClick={logout}>Sign out</button></p>
        </section>
      </main>
    );
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
            {isSupabaseConfigured ? 'Supabase Cloud' : 'Master Live Catalog'}
          </span>
          <span className="admin-slot-header-pill">
            Supabase-verified administrator
          </span>
        </div>

        <div className="admin-nav-actions">
          <Link to="/" className="btn btn-sm btn-ghost">
            ← View Live Store
          </Link>
          <button onClick={handleAdminLogout} className="btn btn-sm btn-outline">
            Sign Out ({user?.name?.split(' ')[0] || 'Admin'})
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
            <span className="metric-label">Account Access</span>
            <strong className="metric-val">Verified</strong>
            <span className="metric-hint">Role confirmed by Supabase</span>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="admin-tab-bar">
          <button
            className={`admin-tab-pill ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products & Catalog ({products.length})
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Customer Orders ({orders.length})
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.filter(review => review.status === 'pending').length} pending)
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            Newsletter ({newsletterSubscribers.length})
          </button>
          <button
            className={`admin-tab-pill ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admin Security
          </button>
        </div>

        {activeTab === 'products' && (
          <AdminProductsSection
            products={products}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            addToast={addToast}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersSection orders={orders} updateOrderStatus={updateOrderStatus} />
        )}
        {activeTab === 'inventory' && (
          <AdminInventorySection
            products={products}
            inventory={inventory}
            saveInventoryVariant={saveInventoryVariant}
          />
        )}
        {activeTab === 'reviews' && (
          <AdminReviewsSection reviews={reviews} moderateReview={moderateReview} />
        )}
        {activeTab === 'subscribers' && (
          <AdminSubscribersSection subscribers={newsletterSubscribers} />
        )}

        {activeTab === 'admins' && (
          <AdminTeamSection />
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// Admin Team & Security Quota Management Section
// -------------------------------------------------------------
function AdminTeamSection() {
  return (
    <section className="admin-team-section">
      <div className="section-toolbar-row">
        <div>
          <h2>Administrator access</h2>
          <p className="section-desc">
            Administrator privileges are assigned through the protected Supabase user_roles table.
            They cannot be created, elevated or removed from a public browser session.
          </p>
        </div>
      </div>
      <div className="admin-quota-banner banner-slots-full">
        <div className="quota-banner-body">
          <strong>Protected administrator provisioning</strong>
          <p>
            Ask the project owner to provision or revoke an administrator role using the trusted
            Supabase SQL editor. This prevents customers from granting themselves store access.
          </p>
        </div>
      </div>
    </section>
  );
}

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
      isNew: Boolean(p.isNew),
      inventoryTracking: Boolean(p.inventoryTracking)
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
                    {Array.isArray(p.images) ? p.images.length : (p.images ? 1 : 0)} photos
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
// Newsletter Subscriber List
// -------------------------------------------------------------
function AdminSubscribersSection({ subscribers }) {
  return (
    <section className="admin-products-section">
      <div className="section-toolbar-row">
        <div>
          <h2>Newsletter subscribers</h2>
          <p className="section-desc">Subscriber addresses are private and visible only to verified administrators. Campaign delivery is not connected yet.</p>
        </div>
        <strong>{subscribers.length} subscribers</strong>
      </div>
      {!subscribers.length ? (
        <div className="admin-empty-state"><p>No newsletter subscribers yet.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead><tr><th>Email address</th><th>Subscribed</th></tr></thead>
            <tbody>
              {subscribers.map(subscriber => (
                <tr key={subscriber.email}>
                  <td>{subscriber.email}</td>
                  <td>{new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// Variant Inventory Management
// -------------------------------------------------------------
function AdminInventorySection({ products, inventory, saveInventoryVariant }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState('');
  const selectedProduct = products.find(product => String(product.id) === String(selectedProductId));

  useEffect(() => {
    if (!selectedProductId && products[0]?.id) setSelectedProductId(products[0].id);
  }, [products, selectedProductId]);

  const variants = selectedProduct
    ? (selectedProduct.sizes || []).flatMap(size =>
        (selectedProduct.colors || []).map(color => ({ size, color }))
      )
    : [];

  const variantKey = (size, color) => `${selectedProductId}:${size}:${color}`;
  const getStock = (size, color) => inventory.find(row =>
    row.product_id === selectedProductId && row.size === size && row.color === color
  )?.quantity;

  const handleSave = async (size, color) => {
    const key = variantKey(size, color);
    const quantity = drafts[key] ?? getStock(size, color) ?? 0;
    setSavingKey(key);
    try {
      await saveInventoryVariant(selectedProductId, size, color, quantity);
    } catch {
      // Store context displays the server error.
    } finally {
      setSavingKey('');
    }
  };

  return (
    <section className="admin-products-section">
      <div className="section-toolbar-row">
        <div>
          <h2>Variant stock control</h2>
          <p className="section-desc">Set stock separately for every size and colour. Tracked stock is checked and decremented atomically when an order is placed.</p>
        </div>
        <select
          className="admin-filter-select"
          value={selectedProductId}
          onChange={event => setSelectedProductId(event.target.value)}
          aria-label="Choose product to manage stock"
        >
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </div>

      {!selectedProduct ? (
        <div className="admin-empty-state"><p>No products are available to manage.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr><th>Size</th><th>Colour</th><th>Available units</th><th>Stock status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {variants.map(({ size, color }) => {
                const key = variantKey(size, color);
                const stored = getStock(size, color);
                const value = drafts[key] ?? (stored == null ? '' : stored);
                return (
                  <tr key={key}>
                    <td>{size}</td>
                    <td>{color}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100000"
                        step="1"
                        value={value}
                        onChange={event => setDrafts(prev => ({ ...prev, [key]: event.target.value }))}
                        aria-label={`Stock for ${selectedProduct.name}, ${size}, ${color}`}
                      />
                    </td>
                    <td>{stored == null ? 'Not tracked' : stored > 0 ? `${stored} available` : 'Out of stock'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingKey === key || value === '' || !Number.isInteger(Number(value)) || Number(value) < 0}
                        onClick={() => handleSave(size, color)}
                      >
                        {savingKey === key ? 'Saving…' : 'Save stock'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// Customer Review Moderation
// -------------------------------------------------------------
function AdminReviewsSection({ reviews, moderateReview }) {
  const [busyId, setBusyId] = useState('');
  const handleModeration = async (review, status) => {
    setBusyId(review.id);
    try {
      await moderateReview(review.id, status);
    } catch (error) {
      window.alert(error.message || 'Review could not be moderated.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="admin-products-section">
      <div className="section-toolbar-row">
        <div>
          <h2>Customer reviews</h2>
          <p className="section-desc">Only reviews from customers with a recorded purchase can be submitted. Approve reviews before they appear publicly.</p>
        </div>
      </div>
      {!reviews.length ? (
        <div className="admin-empty-state"><p>No reviews have been submitted yet.</p></div>
      ) : (
        <div className="admin-cards-grid">
          {reviews.map(review => (
            <article className="admin-account-card" key={review.id}>
              <div className="admin-card-header">
                <div className="admin-card-title">
                  <strong>{review.title}</strong>
                  <span className="admin-card-slot">{'★'.repeat(review.rating)} · {review.status}</span>
                </div>
              </div>
              <p>{review.body}</p>
              <small>{new Date(review.created_at).toLocaleString()}</small>
              {review.status === 'pending' && (
                <div className="admin-card-actions">
                  <button type="button" className="btn btn-sm btn-primary" disabled={busyId === review.id} onClick={() => handleModeration(review, 'published')}>
                    {busyId === review.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline btn-danger" disabled={busyId === review.id} onClick={() => handleModeration(review, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------
// Admin Orders Management Section
// -------------------------------------------------------------
function AdminOrdersSection({ orders, updateOrderStatus }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [ordersList, setOrdersList] = useState(orders);
  const [busyOrderId, setBusyOrderId] = useState('');

  useEffect(() => {
    setOrdersList(orders);
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setBusyOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrdersList(prev => prev.map(order => order.id === orderId ? updated : order));
    } catch (error) {
      window.alert(error.message || 'Order status could not be updated.');
    } finally {
      setBusyOrderId('');
    }
  };



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
                    <option value="cancelled">Cancelled</option>
                  </select>

                </div>
              </div>

              <div className="order-contact-details">
                <span>Phone: <strong>{order.phone}</strong></span>
                <span>State: <strong>{order.state}</strong></span>
                <span>Address: <strong>{order.location}</strong></span>
                {order.customer_email && <span>Email: <strong>{order.customer_email}</strong></span>}
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
                    Message on WhatsApp
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
