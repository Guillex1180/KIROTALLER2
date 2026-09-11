// In dev: Vite proxy forwards /api → http://localhost:3001
// In production: VITE_API_URL must be set to the Render backend URL (e.g. https://shopkiro-api.onrender.com)
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Stable session ID stored in sessionStorage
const getSessionId = () => {
  let sid = sessionStorage.getItem('session_id');
  if (!sid) {
    sid = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('session_id', sid);
  }
  return sid;
};

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Session-ID': getSessionId(),
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'API error');
  }
  return data.data;
};

// ── Products ──────────────────────────────────────────────
export const fetchProducts = ({ search = '', category = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category && category !== 'All') params.set('category', category);
  return fetch(`${BASE}/products?${params}`, { headers: headers() }).then(handleResponse);
};

export const fetchCategories = () =>
  fetch(`${BASE}/products/categories`, { headers: headers() }).then(handleResponse);

export const fetchProduct = (id) =>
  fetch(`${BASE}/products/${id}`, { headers: headers() }).then(handleResponse);

// ── Cart ──────────────────────────────────────────────────
export const fetchCart = () =>
  fetch(`${BASE}/cart`, { headers: headers() }).then(handleResponse);

export const addToCart = (product_id, quantity = 1) =>
  fetch(`${BASE}/cart`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ product_id, quantity }),
  }).then(handleResponse);

export const updateCartItem = (cartItemId, quantity) =>
  fetch(`${BASE}/cart/${cartItemId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ quantity }),
  }).then(handleResponse);

export const removeCartItem = (cartItemId) =>
  fetch(`${BASE}/cart/${cartItemId}`, {
    method: 'DELETE',
    headers: headers(),
  }).then(handleResponse);

export const clearCart = () =>
  fetch(`${BASE}/cart`, { method: 'DELETE', headers: headers() }).then(handleResponse);

export const checkout = () =>
  fetch(`${BASE}/cart/checkout`, { method: 'POST', headers: headers() })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Checkout failed');
      return data;
    });
