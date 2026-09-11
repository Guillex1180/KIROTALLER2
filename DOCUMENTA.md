# DOCUMENTA.md — Guía completa del proyecto ShopKiro

## ¿Qué es ShopKiro?

ShopKiro es una aplicación de e-commerce full-stack de tres capas construida como proyecto de aprendizaje en el contexto del **Taller Kiro AWS**. Demuestra cómo desplegar una aplicación web moderna completa en AWS usando infraestructura como código (IaC) con AWS CDK.

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                        USUARIO                          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront (CDN global)                    │
│         xxxxxxxxxxxx.cloudfront.net                     │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│   S3 (privado)   │   │     API Gateway HTTP             │
│  index.html      │   │  xxxxxxxxxx.execute-api.amazonaws │
│  assets JS/CSS   │   └──────────────┬───────────────────┘
└──────────────────┘                  │
                                      ▼
                         ┌────────────────────────┐
                         │   Lambda Node.js 22    │
                         │   Express + SQLite     │
                         │   /tmp/ecommerce.db    │
                         └────────────────────────┘
```

---

## Stack tecnológico

### Frontend
| Herramienta | Versión | Rol |
|---|---|---|
| React | ^18.3.1 | UI library |
| React Router DOM | ^6.22.3 | Enrutamiento SPA |
| Vite | ^5.4.2 | Dev server y bundler |
| CSS vanilla | — | Estilos sin frameworks externos |

### Backend
| Herramienta | Versión | Rol |
|---|---|---|
| Node.js | v22.5+ | Runtime |
| Express | ^4.18.2 | Framework REST API |
| node:sqlite | nativo | Base de datos embebida |
| serverless-http | ^4.0.0 | Adaptador Express → Lambda |

### Infraestructura AWS (CDK Python)
| Servicio | Uso |
|---|---|
| S3 | Assets estáticos del frontend |
| CloudFront | CDN + HTTPS + fallback SPA |
| API Gateway HTTP | Endpoint público del backend |
| Lambda Node 22 | Ejecuta Express (512 MB, 30s timeout) |
| IAM | Acceso privado CloudFront → S3 via OAC |

---

## Estructura del proyecto

```
KIROTALLER/
├── app.py                      # Punto de entrada CDK
├── cdk.json                    # Config CDK toolkit
├── requirements.txt            # Deps Python (aws-cdk-lib, constructs)
├── kirotaller/
│   └── kirotaller_stack.py     # Stack CDK: define toda la infra AWS
└── ecommerce/
    ├── client/                 # React + Vite (puerto 5173)
    │   └── src/
    │       ├── App.jsx         # Rutas principales
    │       ├── api.js          # Capa fetch centralizada
    │       ├── pages/          # HomePage, ProductPage, CartPage
    │       ├── components/     # Navbar, ProductCard, StarRating
    │       └── context/        # CartContext (estado global)
    └── server/                 # Node.js + Express (puerto 3001)
        └── src/
            ├── index.js        # Servidor local
            ├── lambda.js       # Handler Lambda
            ├── database/       # db.js, seed.js, autoSeed.js
            └── routes/         # products.js, cart.js
```

---

## API REST — Referencia rápida

Todas las respuestas: `{ "success": true, "data": <payload> }`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Lista productos (`?search=` `?category=`) |
| GET | `/api/products/categories` | Lista categorías |
| GET | `/api/products/:id` | Detalle + reseñas |
| GET | `/api/cart` | Contenido del carrito con totales |
| POST | `/api/cart` | Agregar ítem `{ product_id, quantity }` |
| PUT | `/api/cart/:id` | Actualizar cantidad `{ quantity }` |
| DELETE | `/api/cart/:id` | Eliminar ítem |
| DELETE | `/api/cart` | Vaciar carrito |
| POST | `/api/cart/checkout` | Procesar orden y vaciar carrito |

> El carrito requiere cabecera `X-Session-ID` en todas las llamadas.

---

## Base de datos SQLite

```sql
products   (id, name, description, price, category, emoji, rating, review_count, stock, created_at)
cart_items (id, session_id, product_id, quantity, added_at)
reviews    (id, product_id, reviewer, rating, comment, created_at)
```

- Local: `server/data/ecommerce.db`
- Lambda: `/tmp/ecommerce.db` (efímero, se re-siembra en cada cold start)
- 20 productos y 18 reseñas precargadas vía `npm run seed`

---

## Guía de inicio rápido (desarrollo local)

### 1. Levantar el backend

```bash
cd ecommerce/server
npm install
npm run seed        # Crea y siembra la base de datos
npm start           # API en http://localhost:3001
```

### 2. Levantar el frontend

```bash
cd ecommerce/client
npm install
npm run dev         # App en http://localhost:5173
```

### 3. Verificar que funciona

```bash
curl http://localhost:3001/api/health
# { "success": true, "message": "E-Commerce API is running", ... }
```

---

## Guía de despliegue en AWS

### Requisitos previos

```bash
# Activar entorno virtual Python
source .venv/bin/activate       # macOS/Linux
.venv\Scripts\activate.bat      # Windows

# Instalar dependencias CDK
pip install -r requirements.txt
```

### Paso 1 — Desplegar infraestructura

```bash
cdk deploy
```

Guarda los outputs de `cdk-outputs.json`:
- `BackendURL` — URL de API Gateway
- `FrontendURL` — URL de CloudFront
- `FrontendBucketName` — nombre del bucket S3
- `CloudFrontDistributionId` — ID de la distribución

### Paso 2 — Build del frontend

```bash
cd ecommerce/client
VITE_API_URL=<BackendURL> npm run build
```

### Paso 3 — Subir assets a S3

```bash
aws s3 sync dist/ s3://<FrontendBucketName> --delete
```

### Paso 4 — Invalidar caché CloudFront

```bash
aws cloudfront create-invalidation \
  --distribution-id <CloudFrontDistributionId> \
  --paths "/*"
```

### Limpiar todos los recursos

```bash
cdk destroy
```

---

## Steering docs de Kiro

Este proyecto incluye 7 archivos de dirección en `.kiro/steering/` que Kiro IDE lee automáticamente:

| Archivo | Inclusión | Descripción |
|---|---|---|
| `product.md` | Siempre | Propósito, usuarios y características del producto |
| `tech.md` | Siempre | Stack completo con versiones y restricciones |
| `structure.md` | Siempre | Árbol de directorios y convenciones de código |
| `python-venv.md` | Al editar `.py` | Guía del entorno virtual Python y CDK |
| `cdk-deploy.md` | Automático | Flujo completo de despliegue en AWS |
| `api-contracts.md` | Al editar `.js/.jsx` | Contratos REST con ejemplos |
| `db-schema.md` | Al editar server `.js` | Esquema SQLite y patrones de consulta |

---

## Decisiones de diseño clave

| Decisión | Motivo |
|---|---|
| SQLite en lugar de RDS | Simplicidad para taller; sin infra adicional de BD |
| `node:sqlite` nativo | Sin compilación nativa; funciona en Lambda sin capas |
| Express envuelto con `serverless-http` | Mismo código en local y en Lambda |
| CDK en Python | Consistencia con el ecosistema del taller |
| CloudFront OAC + S3 privado | Bucket nunca expuesto públicamente |
| CSS vanilla sin frameworks | Build más simple; suficiente para el alcance del proyecto |
| React Context en lugar de Redux | Estado del carrito simple; sin librería externa necesaria |

---

## Repositorio

- GitHub: [https://github.com/Guillex1180/KIROTALLER2](https://github.com/Guillex1180/KIROTALLER2)
- Proyecto base: KIROTALLER (CDK stack + aplicación ShopKiro)
