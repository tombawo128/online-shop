import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { money } from '../config.js';
import { Grid } from '../components/productcard.jsx';
import { supabase } from '../lib/supabase.js';
import { Helmet } from 'react-helmet-async';

export default function Product() {
  const { id } = useParams();
  const { products, loading, addToCart, toggleWishlist, isWishlisted, user } = useStore();
  const nav = useNavigate();

  const product = products.find(x => String(x.id) === String(id));

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState('details');
  const [validationError, setValidationError] = useState('');
  const [variantAvailability, setVariantAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setActiveImageIndex(0);
    setVariantAvailability(null);
  }, [id]);

  // Load public stock availability without exposing customer or order data.
  useEffect(() => {
    let active = true;
    const loadAvailability = async () => {
      if (!product?.inventoryTracking || !supabase || !/^[0-9a-f-]{36}$/i.test(String(product.id))) {
        setVariantAvailability(null);
        setAvailabilityLoading(false);
        return;
      }
      setAvailabilityLoading(true);
      const { data, error } = await supabase.rpc('get_product_variant_availability', {
        p_product_id: product.id
      });
      if (!active) return;
      if (error) {
        console.warn('Variant availability could not be loaded:', error);
        setVariantAvailability([]);
      } else {
        setVariantAvailability(data || []);
      }
      setAvailabilityLoading(false);
    };
    loadAvailability();
    return () => { active = false; };
  }, [product?.id, product?.inventoryTracking]);

  const isVariantAvailable = (size, color) => {
    if (!product) return false;
    if (!product.inventoryTracking) return !product.soldout?.includes(size);
    if (variantAvailability === null) return false;
    return variantAvailability.some(variant =>
      variant.size === size && variant.color === color && variant.available
    );
  };

  // Choose a valid default variant after product and stock information load.
  useEffect(() => {
    if (!product) return;
    const firstColor = product.colors?.[0] || '';
    const color = selectedColor || firstColor;
    if (!selectedColor && firstColor) setSelectedColor(firstColor);
    if (!selectedSize) {
      const firstAvailable = (product.sizes || []).find(size =>
        isVariantAvailable(size, color)
      );
      if (firstAvailable) setSelectedSize(firstAvailable);
      else if (!product.inventoryTracking) setSelectedSize(product.sizes?.[0] || '');
    }
  }, [product, selectedColor, selectedSize, variantAvailability]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
      .slice(0, 4);
  }, [products, product]);

  if (loading) {
    return (
      <main className="pdp-container">
        <div className="pdp-skeleton-layout">
          <div className="pdp-skeleton-img" />
          <div className="pdp-skeleton-info">
            <div className="skel-line w-60" />
            <div className="skel-line w-40" />
            <div className="skel-line w-80" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="center-empty-screen">
        <div className="empty-box">
          <h2>Product Not Found</h2>
          <p>The item you are looking for is currently unavailable.</p>
          <Link to="/shop" className="btn btn-primary">
            Browse Clothes
          </Link>
        </div>
      </main>
    );
  }

  const isWish = isWishlisted(product.id);

  const handleAdd = (goToCart = false) => {
    setValidationError('');
    if (!selectedSize) {
      setValidationError('Please select a size to proceed.');
      return;
    }
    if (!selectedColor) {
      setValidationError('Please select a color option.');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      size: selectedSize,
      color: selectedColor,
      qty: quantity
    }, !goToCart);

    if (goToCart) {
      nav('/cart');
    }
  };

  const imagesList = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'];

  return (
    <main className="pdp-container">
      <Helmet>
        <title>{product.name} | Urban Thread</title>
        <meta name="description" content={(product.description || `Shop ${product.name} at Urban Thread.`).slice(0, 155)} />
        {product.images?.[0] && <meta property="og:image" content={product.images[0]} />}
        <meta property="og:title" content={`${product.name} | Urban Thread`} />
      </Helmet>
      {/* Breadcrumbs */}
      <nav className="pdp-breadcrumbs" aria-label="Breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?gender=${product.gender}`}>
          {product.gender === 'women' ? "Women's" : "Men's"}
        </Link>
        <span>/</span>
        <span className="current-crumb">{product.name}</span>
      </nav>

      <div className="pdp-main-grid">
        {/* Left Column: Visual Gallery */}
        <div className="pdp-gallery-col">
          <div className="pdp-main-image-wrap">
            <img
              src={imagesList[activeImageIndex] || imagesList[0]}
              alt={product.name}
              className="pdp-hero-image"
            />
            {product.isNew && <span className="pdp-badge">New In</span>}
          </div>

          {imagesList.length > 1 && (
            <div className="pdp-thumbnails-strip">
              {imagesList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pdp-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View image angle ${idx + 1}`}
                >
                  <img src={imgUrl} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Meta & Purchase Panel */}
        <div className="pdp-info-col">
          <div className="pdp-header">
            <div className="pdp-meta-row">
              <span className="pdp-category-tag">{product.category}</span>
              {Number(product.reviewCount) > 0 && Number(product.rating) > 0 ? (
                <span className="pdp-rating-stars">
                  ★ {Number(product.rating).toFixed(1)} <span className="review-num">({product.reviewCount} verified reviews)</span>
                </span>
              ) : <span className="pdp-rating-stars">No reviews yet</span>}
            </div>

            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-price-row">
              <span className="pdp-current-price">{money(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="pdp-strike-price">{money(product.originalPrice)}</span>
              )}
              <span className="pdp-stock-status">{product.inventoryTracking ? (availabilityLoading ? "Checking availability…" : isVariantAvailable(selectedSize, selectedColor) ? "✓ In Stock & Ready to Ship" : "Currently unavailable") : "Availability confirmed at checkout"}</span>
            </div>
          </div>

          <p className="pdp-lead-description">{product.description}</p>

          <hr className="pdp-divider" />

          {/* Color Selector */}
          <div className="pdp-option-group">
            <div className="option-label-bar">
              <label>Color: <strong>{selectedColor}</strong></label>
            </div>
            <div className="pdp-color-pills">
              {(product.colors || ['standard']).map(colorName => (
                <button
                  key={colorName}
                  type="button"
                  className={`color-pill ${selectedColor === colorName ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(colorName)}
                >
                  <span
                    className="color-pill-dot"
                    style={{ backgroundColor: getColorPreview(colorName) }}
                  />
                  <span>{colorName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="pdp-option-group">
            <div className="option-label-bar">
              <label>Size: <strong>{selectedSize}</strong></label>
              <button
                type="button"
                className="link-size-guide"
                onClick={() => alert('Size Chart: XS (US 0-2), S (US 4-6), M (US 8-10), L (US 12-14), XL (US 16). True to size tailoring.')}
              >
                Size Guide
              </button>
            </div>
            <div className="pdp-size-chips">
              {(product.sizes || ['One Size']).map(sizeVal => {
                const isSoldOut = !isVariantAvailable(sizeVal, selectedColor);
                return (
                  <button
                    key={sizeVal}
                    type="button"
                    disabled={isSoldOut || (product.inventoryTracking && availabilityLoading)}
                    className={`size-chip ${selectedSize === sizeVal ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}`}
                    onClick={() => setSelectedSize(sizeVal)}
                    title={isSoldOut ? 'Sold out' : `Select size ${sizeVal}`}
                  >
                    {sizeVal}
                    {isSoldOut && <span className="soldout-cross">✕</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="pdp-option-group">
            <label>Quantity</label>
            <div className="pdp-qty-stepper">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-number">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="pdp-alert-err">
              <span>!</span> {validationError}
            </div>
          )}

          {/* Action CTAs */}
          <div className="pdp-actions-row">
            <button
              type="button"
              className="btn btn-primary btn-pdp-add"
              onClick={() => handleAdd(false)}
            >
              Add to Bag • {money(product.price * quantity)}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-pdp-buy"
              onClick={() => handleAdd(true)}
            >
              Buy Now
            </button>

            <button
              type="button"
              className={`btn-pdp-wishlist ${isWish ? 'active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label={isWish ? 'Remove from wishlist' : 'Save to wishlist'}
              title="Save to Wishlist"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isWish ? '#000000' : 'none'} stroke={isWish ? '#000000' : 'currentColor'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Accordion Tabs */}
          <div className="pdp-accordions">
            <div className="accordion-item">
              <button
                type="button"
                className="accordion-head"
                onClick={() => setActiveAccordion(activeAccordion === 'details' ? '' : 'details')}
              >
                <span>Product Details & Fit</span>
                <span className="acc-icon">{activeAccordion === 'details' ? '−' : '+'}</span>
              </button>
              {activeAccordion === 'details' && (
                <div className="accordion-body">
                  <p>
                    Engineered with French seams and tailored for an effortlessly relaxed yet refined drape. Finished with natural mother-of-pearl or horn hardware. Model is 5'10" (178cm) wearing size Small.
                  </p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button
                type="button"
                className="accordion-head"
                onClick={() => setActiveAccordion(activeAccordion === 'care' ? '' : 'care')}
              >
                <span>Fabric Composition & Care</span>
                <span className="acc-icon">{activeAccordion === 'care' ? '−' : '+'}</span>
              </button>
              {activeAccordion === 'care' && (
                <div className="accordion-body">
                  <p>
                    • 100% natural organic origin fibers.<br />
                    • Cold delicate machine wash inside-out or eco dry clean.<br />
                    • Reshape while damp and hang dry in shaded air.<br />
                    • Warm iron with steam for crisp structure.
                  </p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button
                type="button"
                className="accordion-head"
                onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? '' : 'shipping')}
              >
                <span>Complimentary Delivery & Returns</span>
                <span className="acc-icon">{activeAccordion === 'shipping' ? '−' : '+'}</span>
              </button>
              {activeAccordion === 'shipping' && (
                <div className="accordion-body">
                  <p>
                    Complimentary express dispatch on all orders exceeding $75. Tracked delivery in 2-4 business days. Returns accepted within 30 days of receipt in unworn original packaging.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} user={user} />

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-section">
          <div className="section-head-center">
            <span className="section-eyebrow">COMPLETE THE LOOK</span>
            <h2>You May Also Admire</h2>
          </div>
          <Grid items={relatedProducts} loading={false} />
        </section>
      )}
    </main>
  );
}

function ProductReviews({ productId, user }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabase || !/^[0-9a-f-]{36}$/i.test(String(productId))) return undefined;
    supabase.from('product_reviews')
      .select('id,rating,title,body,created_at')
      .eq('product_id', productId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (active && !error) setReviews(data || []);
      });
    return () => { active = false; };
  }, [productId]);

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!user) {
      setMessage('Sign in with the account used for your purchase to submit a review.');
      return;
    }
    if (title.trim().length < 3 || body.trim().length < 10) {
      setMessage('Add a title and a review of at least 10 characters.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating: Number(rating),
      title: title.trim(),
      body: body.trim(),
      status: 'pending'
    });
    setBusy(false);
    if (error) {
      setMessage(error.code === '23505'
        ? 'You have already submitted a review for this product.'
        : error.message || 'A verified purchase is required before reviewing this product.');
      return;
    }
    setTitle('');
    setBody('');
    setMessage('Review submitted. It will appear after moderation and purchase verification.');
  };

  return (
    <section className="pdp-related-section" aria-labelledby="product-reviews-heading">
      <div className="section-head-center">
        <span className="section-eyebrow">CUSTOMER FEEDBACK</span>
        <h2 id="product-reviews-heading">Customer Reviews</h2>
      </div>
      <div className="reviews-list">
        {reviews.length ? reviews.map(review => (
          <article className="accordion-item" key={review.id}>
            <strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} · {review.title}</strong>
            <p>{review.body}</p>
            <small>{new Date(review.created_at).toLocaleDateString()}</small>
          </article>
        )) : <p className="section-desc">No published reviews yet. Reviews are accepted from verified customers.</p>}
      </div>
      <form className="admin-grid-form" onSubmit={submitReview}>
        <h3>Write a review</h3>
        <div className="form-group">
          <label htmlFor="review-rating">Rating</label>
          <select id="review-rating" value={rating} onChange={event => setRating(Number(event.target.value))}>
            {[5,4,3,2,1].map(value => <option key={value} value={value}>{value} out of 5</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="review-title">Review title</label>
          <input id="review-title" value={title} maxLength={120} onChange={event => setTitle(event.target.value)} required />
        </div>
        <div className="form-group full-span">
          <label htmlFor="review-body">Your review</label>
          <textarea id="review-body" value={body} maxLength={2000} rows={4} onChange={event => setBody(event.target.value)} required />
        </div>
        {message && <p className="full-span" role="status">{message}</p>}
        <div className="full-span">
          <button type="submit" className="btn btn-primary" disabled={busy || !supabase}>
            {busy ? 'Submitting…' : 'Submit verified review'}
          </button>
        </div>
      </form>
    </section>
  );
}

function getColorPreview(colorName) {
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
