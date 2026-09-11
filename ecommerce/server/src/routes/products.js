const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/products - list all products with optional search and category filter
router.get('/', (req, res) => {
  try {
    const { search, category } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = {};

    if (search) {
      query += ' AND (LOWER(name) LIKE $term1 OR LOWER(description) LIKE $term2 OR LOWER(category) LIKE $term3)';
      const term = `%${search.toLowerCase()}%`;
      params.$term1 = term;
      params.$term2 = term;
      params.$term3 = term;
    }

    if (category && category !== 'All') {
      query += ' AND category = $category';
      params.$category = category;
    }

    query += ' ORDER BY id ASC';

    const products = db.prepare(query).all(params);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - list all unique categories
router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all();
    const categories = rows.map((r) => r.category);
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /api/products/:id - single product with its reviews
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = $id').get({ $id: req.params.id });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = db
      .prepare('SELECT * FROM reviews WHERE product_id = $id ORDER BY created_at DESC')
      .all({ $id: req.params.id });

    res.json({ success: true, data: { ...product, reviews } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

module.exports = router;
