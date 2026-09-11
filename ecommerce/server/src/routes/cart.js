const express = require('express');
const router = express.Router();
const db = require('../database/db');

const TAX_RATE = 0.08; // 8%

// Helper: get full cart with product details for a session
const getCartWithDetails = (sessionId) => {
  const items = db
    .prepare(
      `SELECT
        ci.id          AS cart_item_id,
        ci.quantity,
        ci.added_at,
        p.id           AS product_id,
        p.name,
        p.price,
        p.emoji,
        p.category,
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = $sessionId
      ORDER BY ci.added_at ASC`
    )
    .all({ $sessionId: sessionId });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return {
    items,
    subtotal: +subtotal.toFixed(2),
    tax: +tax.toFixed(2),
    total: +total.toFixed(2),
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// GET /api/cart
router.get('/', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    res.json({ success: true, data: getCartWithDetails(sessionId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// POST /api/cart/checkout  — must come before /:cartItemId to avoid route conflict
router.post('/checkout', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    const cart = getCartWithDetails(sessionId);

    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    db.prepare('DELETE FROM cart_items WHERE session_id = $sessionId').run({ $sessionId: sessionId });

    res.json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        order_id: `ORD-${Date.now()}`,
        items_ordered: cart.item_count,
        total_charged: cart.total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Checkout failed' });
  }
});

// POST /api/cart — add item (or increment quantity)
router.post('/', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({ success: false, message: 'product_id and quantity (>=1) are required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = $id').get({ $id: product_id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = db
      .prepare('SELECT * FROM cart_items WHERE session_id = $sid AND product_id = $pid')
      .get({ $sid: sessionId, $pid: product_id });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
      }
      db.prepare('UPDATE cart_items SET quantity = $qty WHERE id = $id').run({ $qty: newQty, $id: existing.id });
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
      }
      db.prepare(
        'INSERT INTO cart_items (session_id, product_id, quantity) VALUES ($sid, $pid, $qty)'
      ).run({ $sid: sessionId, $pid: product_id, $qty: quantity });
    }

    res.status(201).json({ success: true, data: getCartWithDetails(sessionId), message: 'Item added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/:cartItemId — update quantity
router.put('/:cartItemId', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be >= 1' });
    }

    const cartItem = db
      .prepare(
        `SELECT ci.*, p.stock
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.id = $id AND ci.session_id = $sid`
      )
      .get({ $id: cartItemId, $sid: sessionId });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (quantity > cartItem.stock) {
      return res.status(400).json({ success: false, message: `Only ${cartItem.stock} items in stock` });
    }

    db.prepare('UPDATE cart_items SET quantity = $qty WHERE id = $id').run({ $qty: quantity, $id: cartItemId });

    res.json({ success: true, data: getCartWithDetails(sessionId), message: 'Cart updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:cartItemId — remove single item
router.delete('/:cartItemId', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    const { cartItemId } = req.params;

    const result = db
      .prepare('DELETE FROM cart_items WHERE id = $id AND session_id = $sid')
      .run({ $id: cartItemId, $sid: sessionId });

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, data: getCartWithDetails(sessionId), message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove cart item' });
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'default';
    db.prepare('DELETE FROM cart_items WHERE session_id = $sid').run({ $sid: sessionId });
    res.json({
      success: true,
      data: { items: [], subtotal: 0, tax: 0, total: 0, item_count: 0 },
      message: 'Cart cleared',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;
