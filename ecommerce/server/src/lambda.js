/**
 * lambda.js
 * AWS Lambda entry point — wraps the Express app with serverless-http.
 * SQLite is stored in /tmp (ephemeral, re-seeded on cold start via autoSeed.js).
 */
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

// Redirect SQLite DB to /tmp so Lambda can write to it
process.env.DB_PATH = '/tmp/ecommerce.db';

// Auto-seed on cold start
require('./database/autoSeed');

const app = express();

// CORS — allow the CloudFront origin set via env var
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.cloudfront.net')) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-ID'],
}));

app.use(express.json());

app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API is running on Lambda',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports.handler = serverless(app);
