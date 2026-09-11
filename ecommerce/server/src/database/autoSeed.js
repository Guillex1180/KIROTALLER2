/**
 * autoSeed.js
 * Seeds the database on startup if the products table is empty.
 * This ensures the app works even on ephemeral filesystems (Render free tier).
 */
const db = require('./db');

const products = [
  { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound. Perfect for travel, work, and enjoying music without distractions.', price: 129.99, category: 'Electronics', emoji: '🎧', rating: 4.8, review_count: 2341, stock: 45 },
  { name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical keyboard with tactile blue switches, anti-ghosting, and a compact tenkeyless layout. Built for competitive gaming and heavy typing.', price: 89.95, category: 'Electronics', emoji: '⌨️', rating: 4.6, review_count: 1876, stock: 30 },
  { name: 'Stainless Steel Water Bottle', description: 'Vacuum-insulated 32oz bottle that keeps drinks cold for 24 hours and hot for 12 hours. BPA-free, leak-proof lid, and fits most cup holders.', price: 34.99, category: 'Kitchen', emoji: '🍶', rating: 4.7, review_count: 5120, stock: 200 },
  { name: 'Running Shoes', description: 'Lightweight and breathable running shoes with responsive foam cushioning and a durable rubber outsole. Engineered for road and trail runners.', price: 119.00, category: 'Sports', emoji: '👟', rating: 4.5, review_count: 3298, stock: 80 },
  { name: 'Yoga Mat', description: 'Eco-friendly non-slip yoga mat made from natural rubber. 6mm thickness for joint support, comes with a carry strap. Ideal for yoga, pilates, and stretching.', price: 42.50, category: 'Sports', emoji: '🧘', rating: 4.6, review_count: 980, stock: 150 },
  { name: 'Smart Watch', description: 'Feature-rich smartwatch with health monitoring (heart rate, SpO2, sleep tracking), GPS, 5ATM water resistance, and a 7-day battery life.', price: 199.99, category: 'Electronics', emoji: '⌚', rating: 4.4, review_count: 4510, stock: 60 },
  { name: 'Coffee Maker', description: 'Programmable 12-cup drip coffee maker with a built-in grinder, brew-strength control, and a thermal carafe that keeps coffee hot for hours.', price: 79.99, category: 'Kitchen', emoji: '☕', rating: 4.3, review_count: 2100, stock: 55 },
  { name: 'Bestselling Novel: The Silent Path', description: 'A gripping thriller about a detective who uncovers a decades-old conspiracy in a small mountain town. Over 1 million copies sold worldwide.', price: 14.99, category: 'Books', emoji: '📚', rating: 4.9, review_count: 8870, stock: 300 },
  { name: 'Wireless Charging Pad', description: '15W fast wireless charging pad compatible with all Qi-enabled devices. Sleek, slim design with LED indicator and foreign object detection.', price: 24.99, category: 'Electronics', emoji: '🔋', rating: 4.2, review_count: 3340, stock: 120 },
  { name: 'Scented Candle Set', description: 'Set of 4 hand-poured soy wax candles in calming scents: lavender, vanilla, sandalwood, and eucalyptus. Each candle burns up to 40 hours.', price: 38.00, category: 'Home', emoji: '🕯️', rating: 4.8, review_count: 1560, stock: 90 },
  { name: 'Stainless Steel Cookware Set', description: '10-piece stainless steel cookware set including pots, pans, and lids. Tri-ply construction for even heat distribution. Oven and dishwasher safe.', price: 189.95, category: 'Kitchen', emoji: '🍳', rating: 4.7, review_count: 720, stock: 35 },
  { name: 'Portable Bluetooth Speaker', description: 'Waterproof IPX7 Bluetooth speaker with 360 degree surround sound, 20-hour playtime, and a built-in power bank. Perfect for outdoors and travel.', price: 59.99, category: 'Electronics', emoji: '🔊', rating: 4.5, review_count: 6230, stock: 70 },
  { name: 'Leather Wallet', description: 'Slim genuine leather bifold wallet with RFID blocking technology. Holds up to 8 cards and cash. Available in brown and black.', price: 29.99, category: 'Accessories', emoji: '👜', rating: 4.6, review_count: 4100, stock: 200 },
  { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands ranging from 10 to 50 lbs. Made from durable latex with non-slip handles. Great for strength training and physical therapy.', price: 19.99, category: 'Sports', emoji: '💪', rating: 4.4, review_count: 2890, stock: 250 },
  { name: 'Desk Lamp with USB Charging', description: 'LED desk lamp with 5 brightness levels, 3 color modes, touch control, and a built-in USB-A and USB-C charging port. Energy-efficient and eye-friendly.', price: 44.99, category: 'Home', emoji: '💡', rating: 4.5, review_count: 1430, stock: 85 },
  { name: 'Backpack 30L', description: 'Durable 30L backpack with a laptop compartment fitting up to 17 inches, multiple organizer pockets, padded shoulder straps, and a USB charging port.', price: 64.99, category: 'Accessories', emoji: '🎒', rating: 4.7, review_count: 3760, stock: 110 },
  { name: 'Instant Pot 7-in-1', description: 'Multi-use programmable pressure cooker that also works as a slow cooker, rice cooker, steamer, saute pan, yogurt maker, and warmer. 6-quart capacity.', price: 99.95, category: 'Kitchen', emoji: '🫕', rating: 4.8, review_count: 12500, stock: 40 },
  { name: 'Polarized UV400 Sunglasses', description: 'Lightweight polarized sunglasses with UV400 protection. TR90 frame with anti-scratch lenses. Comes with a protective case and cleaning cloth.', price: 32.99, category: 'Accessories', emoji: '🕶️', rating: 4.3, review_count: 2210, stock: 180 },
  { name: 'Indoor Plant: Monstera Deliciosa', description: 'Live Monstera Deliciosa plant in a 6-inch pot. Known for its iconic split leaves and easy-care nature. Perfect for home and office spaces.', price: 27.50, category: 'Home', emoji: '🌿', rating: 4.9, review_count: 654, stock: 60 },
  { name: 'World Map Puzzle 1000 Pieces', description: '1000-piece jigsaw puzzle featuring a stunning world map illustration. Premium thick-cut pieces with a matte finish that reduces glare. Great for all ages.', price: 22.99, category: 'Toys & Games', emoji: '🧩', rating: 4.6, review_count: 1830, stock: 130 },
];

const reviews = [
  { product_id: 1, reviewer: 'Alex M.', rating: 5, comment: 'Absolutely love these! The noise cancellation is incredible — I can finally work from coffee shops without distractions.' },
  { product_id: 1, reviewer: 'Sara J.', rating: 5, comment: 'Best headphones I have ever owned. Sound quality is phenomenal and the battery lasts forever.' },
  { product_id: 1, reviewer: 'Tom K.', rating: 4, comment: 'Great headphones overall. Comfortable for long sessions. Took off one star because the ear cups could be a bit more plush.' },
  { product_id: 2, reviewer: 'Chris P.', rating: 5, comment: 'The tactile feedback is so satisfying. My typing speed has actually improved since switching to this.' },
  { product_id: 2, reviewer: 'Dana L.', rating: 4, comment: 'Solid keyboard with great RGB. A bit loud for an open office, but perfect for home gaming.' },
  { product_id: 3, reviewer: 'Mike R.', rating: 5, comment: 'My ice stayed frozen for a full 24 hours in summer heat. Worth every penny!' },
  { product_id: 3, reviewer: 'Lucy W.', rating: 5, comment: 'I have two of these now. The quality is exceptional and it fits in my car cup holder perfectly.' },
  { product_id: 4, reviewer: 'Jake T.', rating: 5, comment: 'Ran my first 10k in these and my feet felt great the whole time. Super comfortable right out of the box.' },
  { product_id: 4, reviewer: 'Nina S.', rating: 4, comment: 'Very comfortable and lightweight. I do wish they came in more color options.' },
  { product_id: 6, reviewer: 'Olivia B.', rating: 5, comment: 'The health tracking features are so accurate. I love being able to track my sleep and workouts in one place.' },
  { product_id: 6, reviewer: 'Ryan C.', rating: 4, comment: 'Great watch for the price. The GPS is a bit slow to lock sometimes, but otherwise fantastic.' },
  { product_id: 8, reviewer: 'Emma D.', rating: 5, comment: 'Could not put it down! I read it in two days. The plot twists are absolutely mind-blowing.' },
  { product_id: 8, reviewer: 'Will H.', rating: 5, comment: 'One of the best thrillers I have read in years. The characters are so well-developed.' },
  { product_id: 12, reviewer: 'Bella N.', rating: 5, comment: 'Brought this to the beach and it was a hit. Loud, clear sound and truly waterproof.' },
  { product_id: 12, reviewer: 'Ethan F.', rating: 4, comment: 'Great sound for its size. The bass is surprisingly punchy. Perfect for outdoor use.' },
  { product_id: 17, reviewer: 'Claire A.', rating: 5, comment: 'This thing has changed my life! I meal prep for the whole week in just a couple of hours.' },
  { product_id: 17, reviewer: 'Noah G.', rating: 5, comment: 'Best kitchen purchase ever. The pressure cooker function cuts cooking time by 70%.' },
  { product_id: 17, reviewer: 'Mia Z.', rating: 5, comment: 'I use it every single day. Makes perfect rice, soups, and even cheesecakes.' },
];

const row = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (row.count === 0) {
  console.log('🌱 Database empty — seeding initial data...');

  const insertProduct = db.prepare(
    `INSERT INTO products (name, description, price, category, emoji, rating, review_count, stock)
     VALUES ($name, $description, $price, $category, $emoji, $rating, $review_count, $stock)`
  );
  const insertReview = db.prepare(
    `INSERT INTO reviews (product_id, reviewer, rating, comment)
     VALUES ($product_id, $reviewer, $rating, $comment)`
  );

  for (const p of products) {
    insertProduct.run({ $name: p.name, $description: p.description, $price: p.price, $category: p.category, $emoji: p.emoji, $rating: p.rating, $review_count: p.review_count, $stock: p.stock });
  }
  for (const r of reviews) {
    insertReview.run({ $product_id: r.product_id, $reviewer: r.reviewer, $rating: r.rating, $comment: r.comment });
  }

  console.log(`✅ Seeded ${products.length} products and ${reviews.length} reviews.`);
} else {
  console.log(`📦 Database ready (${row.count} products loaded).`);
}
