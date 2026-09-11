---
inclusion: fileMatch
fileMatchPattern: "ecommerce/server/**/*.js"
---

# Esquema de Base de Datos — ShopKiro

## Motor

- **`node:sqlite`** — módulo nativo de Node.js v22.5+
- Sin dependencias externas, sin compilación nativa
- Archivo local: `ecommerce/server/data/ecommerce.db`
- Archivo en Lambda: `/tmp/ecommerce.db` (efímero, re-sembrado en cada cold start)

---

## Tablas

### `products`

```sql
CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  description  TEXT,
  price        REAL    NOT NULL,
  category     TEXT    NOT NULL,
  emoji        TEXT,
  rating       REAL    DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stock        INTEGER DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Identificador único autoincremental |
| `name` | TEXT | Nombre del producto |
| `description` | TEXT | Descripción larga |
| `price` | REAL | Precio en USD |
| `category` | TEXT | Categoría (Electronics, Clothing, Books…) |
| `emoji` | TEXT | Emoji representativo del producto |
| `rating` | REAL | Rating promedio 0.0–5.0 |
| `review_count` | INTEGER | Número total de reseñas |
| `stock` | INTEGER | Unidades disponibles en inventario |
| `created_at` | DATETIME | Fecha de creación |

---

### `cart_items`

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT    NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  added_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
)
```

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Identificador único del ítem en carrito |
| `session_id` | TEXT | ID de sesión del navegador (de `X-Session-ID`) |
| `product_id` | INTEGER FK | Referencia a `products.id` |
| `quantity` | INTEGER | Cantidad de unidades en el carrito |
| `added_at` | DATETIME | Fecha en que se agregó al carrito |

---

### `reviews`

```sql
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  reviewer   TEXT    NOT NULL,
  rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
)
```

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Identificador único de la reseña |
| `product_id` | INTEGER FK | Referencia a `products.id` |
| `reviewer` | TEXT | Nombre del autor de la reseña |
| `rating` | INTEGER | Puntuación 1–5 (CHECK constraint) |
| `comment` | TEXT | Texto de la reseña |
| `created_at` | DATETIME | Fecha de la reseña |

---

## Conexión y uso del módulo nativo

```js
// db.js — patrón de conexión
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/ecommerce.db');
const db = new DatabaseSync(DB_PATH);

// Habilitar foreign keys
db.exec('PRAGMA foreign_keys = ON');
```

- Se usa la API **síncrona** (`DatabaseSync`) — no promesas, no callbacks
- Un único módulo `db.js` exporta la instancia; todas las rutas la importan
- Las queries usan prepared statements para prevenir SQL injection:

```js
// Correcto — prepared statement
const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
const product = stmt.get(id);

// Incorrecto — nunca interpolar directamente
const product = db.exec(`SELECT * FROM products WHERE id = ${id}`); // ❌
```

---

## Siembra de datos

```bash
# Re-sembrar desde cero (elimina y recrea los datos)
cd ecommerce/server
npm run seed
```

El script `seed.js` inserta:
- **20 productos** en categorías: Electronics, Clothing, Books, Home & Garden, Sports
- **18 reseñas** distribuidas entre los productos

El módulo `autoSeed.js` verifica en cada arranque si la tabla `products` está vacía y siembra automáticamente si es necesario (comportamiento crítico en Lambda por el almacenamiento efímero en `/tmp`).
