import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/store.jsx';
import { Grid } from '../components/productcard.jsx';

export default function Shop() {
  const { products, loading, fuse } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlGender = searchParams.get('gender') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSort = searchParams.get('sort') || 'new';

  const [selectedGender, setSelectedGender] = useState(urlGender);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOption, setSortOption] = useState(urlSort);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedGender(urlGender);
    setSelectedCategory(urlCategory);
    setSortOption(urlSort);
  }, [urlGender, urlCategory, urlSort]);

  // Extract unique values
  const allCategories = useMemo(() => {
    return [...new Set(products.flatMap(p => p.category ? [p.category] : []))].sort();
  }, [products]);

  const allSizes = useMemo(() => {
    return [...new Set(products.flatMap(p => p.sizes || []))].sort();
  }, [products]);

  const allColors = useMemo(() => {
    return [...new Set(products.flatMap(p => p.colors || []))].sort();
  }, [products]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let result = urlQuery ? fuse.search(urlQuery).map(r => r.item) : products;

    if (selectedGender) {
      result = result.filter(p => p.gender === selectedGender);
    }
    if (selectedCategory) {
      result = result.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedSize) {
      result = result.filter(p => p.sizes?.includes(selectedSize));
    }
    if (selectedColor) {
      result = result.filter(p => p.colors?.includes(selectedColor));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      result = result.filter(p => p.price <= Number(maxPrice));
    }

    if (sortOption === 'low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // 'new'
      result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [products, fuse, urlQuery, selectedGender, selectedCategory, selectedSize, selectedColor, maxPrice, sortOption]);

  const hasActiveFilters = Boolean(selectedGender || selectedCategory || selectedSize || selectedColor || maxPrice || urlQuery);

  const clearAllFilters = () => {
    setSelectedGender('');
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice('');
    setSortOption('new');
    setSearchParams({});
  };

  const handleGenderSelect = (g) => {
    setSelectedGender(g);
    const sp = new URLSearchParams(searchParams);
    if (g) sp.set('gender', g); else sp.delete('gender');
    setSearchParams(sp);
  };

  const handleCategorySelect = (c) => {
    setSelectedCategory(c);
    const sp = new URLSearchParams(searchParams);
    if (c) sp.set('category', c); else sp.delete('category');
    setSearchParams(sp);
  };

  return (
    <main className="shop-page-wrap">
      {/* Page Header */}
      <div className="shop-header-banner">
        <div className="shop-header-content">
          <span className="shop-breadcrumbs">
            <Link to="/">Home</Link> <span>/</span> Collection
            {selectedGender && <span> / {selectedGender === 'women' ? "Women's" : "Men's"}</span>}
            {selectedCategory && <span> / {selectedCategory}</span>}
          </span>
          <h1>
            {urlQuery
              ? `Results for “${urlQuery}”`
              : selectedGender === 'women'
              ? "Women's Collection"
              : selectedGender === 'men'
              ? "Men's Essentials"
              : selectedCategory
              ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
              : 'All Clothes'}
          </h1>
          <p className="shop-subtitle">
            Everyday fashion and quality clothing for women and men.
          </p>
        </div>
      </div>

      <div className="shop-layout-container">
        {/* Filters Toolbar */}
        <div className="shop-toolbar">
          <div className="toolbar-left">
            {/* Quick Gender Tabs */}
            <div className="gender-tabs">
              <button
                className={`gender-tab ${!selectedGender ? 'active' : ''}`}
                onClick={() => handleGenderSelect('')}
              >
                All
              </button>
              <button
                className={`gender-tab ${selectedGender === 'women' ? 'active' : ''}`}
                onClick={() => handleGenderSelect('women')}
              >
                Women
              </button>
              <button
                className={`gender-tab ${selectedGender === 'men' ? 'active' : ''}`}
                onClick={() => handleGenderSelect('men')}
              >
                Men
              </button>
            </div>

            <button
              className="mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
              <span>⚙ Filters</span>
              {hasActiveFilters && <span className="active-dot" />}
            </button>
          </div>

          <div className="toolbar-right">
            <span className="results-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>

            <div className="sort-wrap">
              <label htmlFor="shop-sort" className="sr-only">Sort By</label>
              <select
                id="shop-sort"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="select-sort"
              >
                <option value="new">Newest Arrivals</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Drawer / Bar */}
        <div className={`filter-bar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="filter-controls-row">
            {/* Category */}
            <div className="filter-item">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={e => handleCategorySelect(e.target.value)}
              >
                <option value="">All Categories</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div className="filter-item">
              <label>Size</label>
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
              >
                <option value="">Any Size</option>
                {allSizes.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="filter-item">
              <label>Color</label>
              <select
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
              >
                <option value="">Any Color</option>
                {allColors.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="filter-item">
              <label>Max Price ($)</label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="No limit"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <div className="filter-item filter-clear-wrap">
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={clearAllFilters}
                >
                  Clear Filters ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {!loading && filteredProducts.length === 0 ? (
          <div className="shop-empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No clothes matched your filters</h3>
            <p>
              {urlQuery
                ? `No products found matching "${urlQuery}". Try searching for another item or browse by department.`
                : 'Try adjusting your filters or price limit to find what you are looking for.'}
            </p>
            <div className="empty-action-links">
              <button onClick={clearAllFilters} className="btn btn-primary">
                Reset All Filters
              </button>
              <Link to="/shop?gender=women" className="btn btn-ghost">
                Women's Tops & Dresses
              </Link>
              <Link to="/shop?gender=men" className="btn btn-ghost">
                Men's Tailoring
              </Link>
            </div>
          </div>
        ) : (
          <Grid items={filteredProducts} loading={loading} />
        )}
      </div>
    </main>
  );
}
