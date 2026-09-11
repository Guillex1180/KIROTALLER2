import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import StarRating from '../components/StarRating.jsx';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const { addItem, loading: cartLoading } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setQuantity(1);
    fetchProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    const success = await addItem(product.id, quantity);
    if (success) {
      setAddedMsg(`✓ ${quantity} item${quantity > 1 ? 's' : ''} added to cart!`);
      setTimeout(() => setAddedMsg(''), 3000);
    }
  };

  const changeQty = (delta) => {
    setQuantity((q) => Math.max(1, Math.min(q + delta, product?.stock || 99)));
  };

  if (loading) {
    return (
      <div className="product-page product-page--loading">
        <div className="product-detail-skeleton">
          <div className="skeleton-emoji-lg" />
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--medium" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-page">
        <div className="error-box" role="alert">
          <p>⚠️ {error}</p>
          <Link to="/" className="btn btn-primary">← Back to Shop</Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="product-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{product.category}</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Product Detail */}
      <div className="product-detail-card">
        <div className="product-detail-visual">
          <div className="product-detail-emoji" aria-hidden="true">{product.emoji}</div>
          <span className="product-category-badge product-category-badge--lg">{product.category}</span>
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-rating">
            <StarRating rating={product.rating} size="lg" />
            <span className="rating-value">{product.rating.toFixed(1)}</span>
            <span className="review-count">({product.review_count.toLocaleString()} reviews)</span>
          </div>

          <div className="product-detail-price">${product.price.toFixed(2)}</div>

          <p className="product-detail-description">{product.description}</p>

          <div className="product-stock">
            {product.stock > 10
              ? <span className="in-stock">✓ In Stock ({product.stock} available)</span>
              : product.stock > 0
              ? <span className="low-stock">⚠ Only {product.stock} left!</span>
              : <span className="out-of-stock">✗ Out of Stock</span>}
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="quantity-add-row">
              <div className="quantity-selector">
                <button
                  className="qty-btn"
                  onClick={() => changeQty(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >−</button>
                <span className="qty-display">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => changeQty(1)}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >+</button>
              </div>
              <button
                className="btn btn-primary btn-add-cart"
                onClick={handleAddToCart}
                disabled={cartLoading}
                aria-label={`Add ${quantity} ${product.name} to cart`}
              >
                🛒 Add to Cart
              </button>
            </div>
          )}

          {addedMsg && <p className="add-success-msg" role="status">{addedMsg}</p>}

          <div className="product-detail-meta">
            <span className="meta-item">🏷️ Category: <strong>{product.category}</strong></span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="reviews-section">
        <h2 className="reviews-heading">
          Customer Reviews
          {product.reviews.length > 0 && <span className="reviews-count-badge">{product.reviews.length}</span>}
        </h2>

        {product.reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first!</p>
        ) : (
          <div className="reviews-list">
            {product.reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-avatar">{review.reviewer.charAt(0)}</span>
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.reviewer}</span>
                    <div className="reviewer-rating">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="rating-num">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductPage;
