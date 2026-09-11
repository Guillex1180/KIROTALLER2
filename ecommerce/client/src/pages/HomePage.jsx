import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchCategories } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(['All', ...cats]))
      .catch((e) => console.error(e));
  }, []);

  // Load products when search or category changes
  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProducts({ search, category: activeCategory })
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, activeCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">Find what you love 🎉</h1>
        <p className="hero-subtitle">Explore our curated collection of 20 handpicked products</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            className="search-input"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          {searchInput && (
            <button className="search-clear" onClick={() => { setSearchInput(''); setSearch(''); }} aria-label="Clear search">✕</button>
          )}
        </div>
      </section>

      {/* Category Filters */}
      <section className="category-filter" aria-label="Filter by category">
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Results Header */}
      <div className="results-header">
        {!loading && (
          <p className="results-count">
            {products.length === 0
              ? 'No products found'
              : `${products.length} product${products.length !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
          </p>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton" aria-hidden="true">
              <div className="skeleton-emoji" />
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--medium" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error-box" role="alert">
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={loadProducts}>Retry</button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h2>No products found</h2>
          <p>Try a different search term or category.</p>
          <button className="btn btn-primary" onClick={() => { setSearchInput(''); setSearch(''); setActiveCategory('All'); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default HomePage;
