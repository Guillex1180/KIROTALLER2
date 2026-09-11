# 🛍️ ShopKiro — Full-Stack E-Commerce App

A complete 3-tier e-commerce web application built with **React**, **Node.js/Express**, and **SQLite** (via Node's built-in `node:sqlite` module).

---

## Architecture

```
ecommerce/
├── client/          # React 18 + Vite frontend (port 5173)
│   └── src/
│       ├── pages/       # HomePage, ProductPage, CartPage
│       ├── components/  # Navbar, ProductCard, StarRating
│       ├── context/     # CartContext (global cart state)
│       ├── api.js       # Fetch wrappers for all API calls
│       └── index.css    # All styles (responsive, no external CSS lib)
│
└── server/          # Node.js + Express REST API (port 3001)
    └── src/
        ├── index.js          # Express app entry point
        ├── database/
        │   ├── db.js         # SQLite connection + schema creation
        │   └── seed.js       # Seeds 20 products & 18 reviews
        └── routes/
            ├── products.js   # GET /api/products, /categories, /:id
            └── cart.js       # GET/POST/PUT/DELETE /api/cart
```

---

## Requirements

- **Node.js v22.5 or later** (uses the built-in `node:sqlite` — no native compilation needed)
- npm

Check your version:
```bash
node --version
```

---

## Quick Start

### 1. Set up and seed the database

```bash
cd server
npm install
npm run seed
```

### 2. Start the API server

```bash
# still in server/
npm start
# API running at http://localhost:3001
```

### 3. Start the frontend (new terminal)

```bash
cd client
npm install
npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Reference

All endpoints return `{ success: boolean, data: ... }`.

Cart endpoints require an `X-Session-ID` header (handled automatically by the frontend).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List products (supports `?search=` and `?category=`) |
| GET | `/api/products/categories` | List all categories |
| GET | `/api/products/:id` | Single product + reviews |
| GET | `/api/cart` | Get cart contents with totals |
| POST | `/api/cart` | Add item `{ product_id, quantity }` |
| PUT | `/api/cart/:id` | Update quantity `{ quantity }` |
| DELETE | `/api/cart/:id` | Remove single item |
| DELETE | `/api/cart` | Clear entire cart |
| POST | `/api/cart/checkout` | Place order & clear cart |

---

## Features

### Home Page
- Grid of 20 products with emoji photos, names, prices, ratings, and categories
- Live search (debounced) across name, description, and category
- Category filter pills
- Skeleton loading states
- "Add to Cart" directly from the grid

### Product Details Page
- Full description, price, stock status
- Quantity selector with stock limit enforcement
- "Add to Cart" with success feedback
- Customer reviews with star ratings and avatars

### Shopping Cart
- Live quantity updates (increment/decrement)
- Remove individual items or clear the entire cart
- Sticky order summary: subtotal, estimated 8% tax, free shipping, total
- Simulated checkout with order confirmation screen

---

## Database Schema

```sql
products     (id, name, description, price, category, emoji, rating, review_count, stock, created_at)
cart_items   (id, session_id, product_id, quantity, added_at)
reviews      (id, product_id, reviewer, rating, comment, created_at)
```

The database file is stored at `server/data/ecommerce.db` and is auto-created on first run.

---

## Re-seeding the Database

To reset and re-seed with the original 20 products:

```bash
cd server
npm run seed
```
