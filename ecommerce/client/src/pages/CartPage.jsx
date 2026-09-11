import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function CartPage() {
  const { cart, loading, error, updateItem, removeItem, emptyCart, placeOrder } = useCart();
  const [orderResult, setOrderResult] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const result = await placeOrder();
      setOrderResult(result);
    } catch (e) {
      setCheckoutError(e.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Order success screen
  if (orderResult) {
    return (
      <div className="cart-page">
        <div className="order-success">
          <div className="success-icon">🎉</div>
          <h1>Order Placed!</h1>
          <p className="order-id">Order ID: <strong>{orderResult.data.order_id}</strong></p>
          <p>Items ordered: <strong>{orderResult.data.items_ordered}</strong></p>
          <p className="order-total">Total charged: <strong>${orderResult.data.total_charged.toFixed(2)}</strong></p>
          <p className="success-note">Thank you for shopping with ShopKiro! Your items are on their way. 🚀</p>
          <Link to="/" className="btn btn-primary btn-lg">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">🛒 Your Cart</h1>
        {cart.items.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={emptyCart}
            disabled={loading}
          >
            Clear Cart
          </button>
        )}
      </div>

      {error && <div className="error-box" role="alert">⚠️ {error}</div>}

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link to="/" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-list">
            {cart.items.map((item) => (
              <article key={item.cart_item_id} className="cart-item">
                <div className="cart-item-emoji" aria-hidden="true">{item.emoji}</div>
                <div className="cart-item-info">
                  <Link to={`/product/${item.product_id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <span className="cart-item-category">{item.category}</span>
                  <span className="cart-item-unit-price">${item.price.toFixed(2)} each</span>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-selector">
                    <button
                      className="qty-btn"
                      onClick={() => updateItem(item.cart_item_id, item.quantity - 1)}
                      disabled={loading || item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateItem(item.cart_item_id, item.quantity + 1)}
                      disabled={loading || item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  <span className="cart-item-subtotal">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    className="btn-remove"
                    onClick={() => removeItem(item.cart_item_id)}
                    disabled={loading}
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Order Summary */}
          <aside className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-line">
              <span>Subtotal ({cart.item_count} item{cart.item_count !== 1 ? 's' : ''})</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Estimated Tax (8%)</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
            <div className="summary-line summary-line--shipping">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-line summary-line--total">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>

            {checkoutError && (
              <p className="checkout-error" role="alert">⚠️ {checkoutError}</p>
            )}

            <button
              className="btn btn-primary btn-checkout"
              onClick={handleCheckout}
              disabled={checkoutLoading || loading}
            >
              {checkoutLoading ? 'Processing...' : '⚡ Checkout'}
            </button>

            <Link to="/" className="continue-shopping-link">
              ← Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
