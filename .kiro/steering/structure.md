# Project Structure — ShopKiro

## Árbol de directorios

```
KIROTALLER/
├── app.py                          # Punto de entrada del CDK app
├── cdk.json                        # Configuración del CDK toolkit
├── cdk.context.json                # Valores de contexto cacheados por CDK
├── cdk-outputs.json                # Outputs del último deploy (BackendURL, FrontendURL, etc.)
├── requirements.txt                # Dependencias Python de producción (aws-cdk-lib, constructs)
├── requirements-dev.txt            # Dependencias Python de desarrollo
├── .venv/                          # Entorno virtual Python (no commitear)
│
├── kirotaller/                     # Módulo Python del CDK stack
│   ├── __init__.py
│   └── kirotaller_stack.py         # KirotallerStack — define toda la infraestructura AWS
│
├── ecommerce/                      # Aplicación full-stack
│   │
│   ├── client/                     # Frontend React + Vite
│   │   ├── index.html              # Shell HTML (punto de entrada Vite)
│   │   ├── vite.config.js          # Config Vite: plugin React + proxy /api → :3001
│   │   ├── package.json
│   │   ├── .env.example            # Plantilla de variables de entorno
│   │   ├── netlify.toml            # Config despliegue alternativo en Netlify
│   │   ├── dist/                   # Build de producción (generado, no commitear)
│   │   └── src/
│   │       ├── main.jsx            # Punto de entrada React (ReactDOM.createRoot)
│   │       ├── App.jsx             # Componente raíz — define rutas con React Router
│   │       ├── api.js              # Capa de acceso a la API (fetch wrappers)
│   │       ├── index.css           # Todos los estilos globales (CSS vanilla, responsive)
│   │       ├── pages/              # Componentes de página (una por ruta)
│   │       │   ├── HomePage.jsx    # / — catálogo con búsqueda y filtros
│   │       │   ├── ProductPage.jsx # /product/:id — detalle + reseñas
│   │       │   └── CartPage.jsx    # /cart — carrito + checkout
│   │       ├── components/         # Componentes reutilizables
│   │       │   ├── Navbar.jsx      # Navegación global con contador del carrito
│   │       │   ├── ProductCard.jsx # Tarjeta de producto para la grid
│   │       │   └── StarRating.jsx  # Componente de rating con estrellas
│   │       ├── context/            # Estado global con React Context API
│   │       │   └── CartContext.jsx # CartProvider + useCart hook
│   │       └── hooks/              # Custom hooks reutilizables
│   │
│   └── server/                     # Backend Node.js + Express
│       ├── package.json
│       ├── Dockerfile              # Para despliegue en contenedores (alternativo)
│       ├── render.yaml             # Config despliegue alternativo en Render
│       ├── data/
│       │   └── ecommerce.db        # Archivo SQLite local (no commitear)
│       └── src/
│           ├── index.js            # Servidor Express local (escucha en :3001)
│           ├── lambda.js           # Handler Lambda — wrappea Express con serverless-http
│           ├── database/
│           │   ├── db.js           # Conexión SQLite + creación de esquema
│           │   ├── seed.js         # Script de siembra: 20 productos + 18 reseñas
│           │   └── autoSeed.js     # Auto-siembra en arranque si la DB está vacía
│           └── routes/
│               ├── products.js     # GET /api/products, /categories, /:id
│               └── cart.js         # GET/POST/PUT/DELETE /api/cart
│
└── tests/                          # Tests del CDK stack (Python)
```

---

## Convenciones de Nomenclatura

### Frontend
| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase + `.jsx` | `ProductCard.jsx` |
| Páginas | PascalCase + `Page.jsx` | `HomePage.jsx` |
| Contextos | PascalCase + `Context.jsx` | `CartContext.jsx` |
| Custom hooks | camelCase + `use` prefix | `useCart` |
| Archivos de utilidad | camelCase + `.js` | `api.js` |
| Clases CSS | kebab-case | `.product-card`, `.cart-summary` |
| Variables de entorno Vite | `VITE_` prefix en mayúsculas | `VITE_API_URL` |

### Backend
| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de ruta | camelCase plural + `.js` | `products.js`, `cart.js` |
| Archivos de módulo | camelCase + `.js` | `db.js`, `autoSeed.js` |
| Variables de entorno | SCREAMING_SNAKE_CASE | `NODE_ENV`, `FRONTEND_URL`, `DB_PATH` |
| Tablas SQL | snake_case plural | `cart_items`, `products` |
| Columnas SQL | snake_case | `product_id`, `review_count` |

### Infraestructura CDK
| Elemento | Convención | Ejemplo |
|---|---|---|
| Stack class | PascalCase + `Stack` | `KirotallerStack` |
| Constructs CDK | PascalCase descriptivo | `FrontendBucket`, `BackendFunction` |
| CfnOutputs | PascalCase | `BackendURL`, `FrontendURL` |
| Módulo Python | snake_case | `kirotaller_stack.py` |

---

## Patrones Arquitectónicos

### Frontend — Separación de responsabilidades
- **`api.js`** es la única capa que hace `fetch` — los componentes nunca llaman a `fetch` directamente
- **`context/CartContext.jsx`** centraliza todo el estado del carrito; los componentes consumen `useCart()`
- **`pages/`** contiene lógica de negocio y estado local de cada vista
- **`components/`** contiene componentes puros o con estado de UI mínimo (sin lógica de negocio)
- Las rutas se definen únicamente en `App.jsx`

### Backend — Arquitectura dual (local / Lambda)
- **`index.js`** — servidor Express standalone para desarrollo local (puerto 3001)
- **`lambda.js`** — el mismo Express envuelto con `serverless-http` para AWS Lambda
- Ambos comparten las mismas rutas (`routes/`) y la misma base de datos (`database/`)
- La variable `DB_PATH` controla dónde se almacena el archivo SQLite (`data/` local vs `/tmp/` en Lambda)

### Respuestas de la API
Todas las respuestas siguen este contrato uniforme:
```json
{ "success": true, "data": <payload> }
{ "success": false, "message": "<descripción del error>" }
```

### Gestión de sesión
El carrito es anónimo. El frontend genera un `session_id` único en `sessionStorage` y lo envía en cada request vía la cabecera `X-Session-ID`. El backend lo usa para aislar los ítems del carrito por sesión de navegador.

---

## Decisiones Arquitectónicas Clave

| Decisión | Razonamiento |
|---|---|
| SQLite en lugar de RDS/DynamoDB | Simplicidad para un taller; sin infraestructura adicional de base de datos |
| `node:sqlite` nativo en vez de paquetes npm | Elimina compilaciones nativas; funciona en Lambda sin capas adicionales |
| Express en Lambda vía `serverless-http` | Reutiliza el mismo código Express en local y en Lambda sin reescribir rutas |
| CDK en Python (no TypeScript) | Consistencia con el ecosistema del taller y con el entorno Python del equipo |
| CloudFront OAC + S3 privado | Buena práctica de seguridad: el bucket S3 nunca es público |
| CSS vanilla | Reduce complejidad de build; suficiente para un proyecto de taller |
| Context API en vez de Redux | El estado del carrito es simple; no justifica una librería externa |

---

## Flujo de Despliegue

```
1. Build frontend:
   cd ecommerce/client && VITE_API_URL=<BackendURL> npm run build

2. Desplegar infraestructura + subir assets:
   cdk deploy                          # Crea/actualiza S3, CloudFront, Lambda, API GW
   aws s3 sync client/dist s3://<bucket> --delete
   aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

Los valores de `<BackendURL>`, `<bucket>` y `<id>` se obtienen de `cdk-outputs.json` tras el deploy.

---

## Archivos que NO se commitean

```
.venv/
ecommerce/server/data/ecommerce.db
ecommerce/client/dist/
ecommerce/server/node_modules/
ecommerce/client/node_modules/
cdk.out/
cdk-outputs.json
.env
```
