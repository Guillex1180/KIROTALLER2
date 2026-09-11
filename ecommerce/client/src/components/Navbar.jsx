import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function Navbar() {
  const { cart } = useCart();
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🛍️</span>
          <span className="brand-name">ShopKiro</span>
        </Link>
        <nav className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
            <span className="cart-icon">🛒</span>
            <span>Cart</span>
            {cart.item_count > 0 && (
              <span className="cart-badge">{cart.item_count}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
