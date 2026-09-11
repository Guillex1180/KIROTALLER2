---
inclusion: fileMatch
fileMatchPattern: "ecommerce/**/*.js|ecommerce/**/*.jsx"
---

# Contratos de la API REST — ShopKiro

## Convenciones globales

- Base URL en producción: `VITE_API_URL` (API Gateway HTTP)
- Base URL en desarrollo: `/api` (proxiado por Vite a `http://localhost:3001`)
- Todas las respuestas son JSON con este contrato uniforme:

```json
// Éxito
{ "success": true, "data": <payload> }

// Error
{ "success": false, "message": "Descripción del error" }
```

- El carrito requiere la cabecera `X-Session-ID` en **todas** las llamadas
- El `session_id` se genera en `sessionStorage` del navegador (ver `api.js`)

---

## Productos

### `GET /api/products`
Lista todos los productos. Soporta filtros opcionales por query string.

**Query params:**
| Param | Tipo | Descripción |
|---|---|---|
| `search` | string | Búsqueda en nombre, descripción y categoría |
| `category` | string | Filtrar por categoría exacta |

**Respuesta `data`:** array de productos
```json
[
  {
    "id": 1,
    "name": "Laptop Pro",
    "description": "...",
    "price": 999.99,
    "category": "Electronics",
    "emoji": "💻",
    "rating": 4.5,
    "review_count": 3,
    "stock": 10
  }
]
```

---

### `GET /api/products/categories`
Lista todas las categorías únicas disponibles.

**Respuesta `data`:** array de strings
```json
["Electronics", "Clothing", "Books", "Home & Garden"]
```

---

### `GET /api/products/:id`
Detalle de un producto con sus reseñas.

**Respuesta `data`:**
```json
{
  "id": 1,
  "name": "Laptop Pro",
  "price": 999.99,
  "category": "Electronics",
  "emoji": "💻",
  "rating": 4.5,
  "stock": 10,
  "reviews": [
    {
      "id": 1,
      "reviewer": "Ana García",
      "rating": 5,
      "comment": "Excelente producto",
      "created_at": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Carrito

> Todas las rutas de carrito requieren: `X-Session-ID: <session_id>`

### `GET /api/cart`
Obtiene el contenido del carrito con totales calculados.

**Respuesta `data`:**
```json
{
  "items": [
    {
      "id": 1,
      "product_id": 3,
      "quantity": 2,
      "name": "Wireless Mouse",
      "price": 29.99,
      "emoji": "🖱️",
      "stock": 50,
      "subtotal": 59.98
    }
  ],
  "summary": {
    "item_count": 2,
    "subtotal": 59.98,
    "tax": 4.80,
    "total": 64.78
  }
}
```

---

### `POST /api/cart`
Agrega un producto al carrito. Si ya existe, incrementa la cantidad.

**Body:**
```json
{ "product_id": 3, "quantity": 1 }
```

**Respuesta `data`:** item del carrito creado/actualizado

---

### `PUT /api/cart/:id`
Actualiza la cantidad de un ítem del carrito.

**Body:**
```json
{ "quantity": 3 }
```

**Respuesta `data`:** item actualizado

---

### `DELETE /api/cart/:id`
Elimina un ítem específico del carrito.

**Respuesta `data`:** `null`

---

### `DELETE /api/cart`
Vacía el carrito completo de la sesión.

**Respuesta `data`:** `null`

---

### `POST /api/cart/checkout`
Procesa el checkout simulado y vacía el carrito.

**Respuesta** (estructura diferente al contrato base):
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order_id": "ORD-1234567890"
}
```

---

## Health Check

### `GET /api/health`
Verifica que el servidor está operativo.

```json
{
  "success": true,
  "message": "E-Commerce API is running",
  "timestamp": "2026-09-10T12:00:00.000Z",
  "env": "production"
}
```

---

## Manejo de errores en el frontend

Toda la lógica de fetch está centralizada en `src/api.js`. El helper `handleResponse` lanza un `Error` si `res.ok` es `false` o si `data.success` es `false`. Los componentes deben capturar estos errores con `try/catch` o con estado de error local.
