import { Link } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useState } from 'react';

function ProductCard({ product }) {
  const { addItem, loading } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault(); // don't navigate
    const success = await addItem(product.id, 1);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-link">
        <div className="product-card-emoji" aria-hidden="true">
          {product.emoji}
        </div>
        <div className="product-card-body">
          <span className="product-category-badge">{product.category}</span>
          <h3 className="product-name">{product.name}</h3>
          <div className="product-meta">
            <StarRating rating={product.rating} size="sm" />
            <span className="review-count">({product.review_count.toLocaleString()})</span>
          </div>
          <div className="product-price">${product.price.toFixed(2)}</div>
        </div>
      </Link>
      <button
        className={`btn btn-cart ${added ? 'btn-added' : ''}`}
        onClick={handleAddToCart}
        disabled={loading || added}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? '✓ Added!' : '🛒 Add to Cart'}
      </button>
    </article>
  );
}

export default ProductCard;
