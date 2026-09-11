# Tech Stack — ShopKiro

## Frontend (`ecommerce/client`)

| Herramienta | Versión | Rol |
|---|---|---|
| React | ^18.3.1 | UI library (componentes funcionales + hooks) |
| React DOM | ^18.3.1 | Renderizado en el navegador |
| React Router DOM | ^6.22.3 | Enrutamiento SPA client-side |
| Vite | ^5.4.2 | Dev server y bundler de producción |
| @vitejs/plugin-react | ^4.3.1 | Transformación JSX con Babel |

### Estilos
- **CSS vanilla** en un único archivo `src/index.css` — sin frameworks externos (no Tailwind, no Bootstrap)
- Diseño responsive manual con media queries
- Convención BEM implícita para nombres de clases

### Entorno y variables de configuración
- `VITE_API_URL` — URL base del backend en producción (API Gateway). No definida en dev; el proxy de Vite la reemplaza.
- `.env.example` incluido en el repositorio como referencia

### Proxy de desarrollo
Vite redirige `/api/*` → `http://localhost:3001` en desarrollo local (configurado en `vite.config.js`), eliminando problemas de CORS durante el desarrollo.

---

## Backend (`ecommerce/server`)

| Herramienta | Versión | Rol |
|---|---|---|
| Node.js | v22.5+ | Runtime (necesario para `node:sqlite` nativo) |
| Express | ^4.18.2 | Framework HTTP REST API |
| cors | ^2.8.5 | Middleware CORS configurable |
| serverless-http | ^4.0.0 | Adaptador Express → AWS Lambda handler |
| SQLite (nativo) | `node:sqlite` | Base de datos embebida — sin dependencias externas |

### Base de datos
- Motor: módulo **`node:sqlite`** incorporado en Node.js v22.5+ — no requiere compilación nativa ni paquetes adicionales
- Esquema con tres tablas: `products`, `cart_items`, `reviews`
- El archivo de base de datos se almacena en:
  - **Local**: `server/data/ecommerce.db`
  - **Lambda**: `/tmp/ecommerce.db` (efímero, re-sembrado en cada cold start vía `autoSeed.js`)
- Script de siembra: `npm run seed` (ejecuta `src/database/seed.js`) — carga 20 productos y 18 reseñas

### Scripts disponibles
```bash
npm start          # Producción: node src/index.js
npm run dev        # Desarrollo con hot-reload: node --watch src/index.js
npm run seed       # Re-sembrar la base de datos desde cero
```

---

## Infraestructura AWS (`kirotaller/` — CDK en Python)

| Herramienta | Versión | Rol |
|---|---|---|
| AWS CDK | >=2.266.0, <3.0.0 | IaC — define y despliega toda la infraestructura |
| constructs | >=10.5.0, <11.0.0 | Biblioteca base de CDK |
| Python | 3.x | Lenguaje del CDK app (`app.py`) |

### Servicios AWS provisionados por CDK

| Servicio | Uso |
|---|---|
| **S3** | Bucket privado para assets del frontend (HTML/JS/CSS) |
| **CloudFront** | CDN global + HTTPS. OAC (Origin Access Control) con SigV4 para acceso privado a S3. Fallback SPA: errores 403/404 → `index.html` |
| **API Gateway HTTP** | Endpoint HTTP público. CORS configurado para CloudFront + `localhost:5173` |
| **Lambda** | Runtime Node.js 22.x. Ejecuta el servidor Express vía `serverless-http`. Memoria: 512 MB, timeout: 30s |
| **IAM** | Policy en el bucket S3 que restringe acceso exclusivamente a la distribución CloudFront |

### Bundling del Lambda
CDK usa un bundler local (`LocalNpmBundler`) que copia el código del servidor y ejecuta `npm install --omit=dev` sin necesitar Docker. Docker solo se usa como fallback si el bundler local falla.

### Variables de entorno Lambda
- `NODE_ENV=production`
- `FRONTEND_URL` — URL de CloudFront, inyectada automáticamente por CDK en el despliegue

---

## Herramientas de Desarrollo

| Herramienta | Uso |
|---|---|
| Python venv (`.venv`) | Entorno virtual aislado para CDK |
| `pip` + `requirements.txt` | Gestión de dependencias Python |
| `npm` | Gestión de dependencias Node.js (client y server por separado) |
| AWS CLI | Autenticación y comandos AWS (`CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`) |
| AWS CDK CLI | `cdk synth`, `cdk deploy`, `cdk diff`, `cdk ls` |

---

## Restricciones Técnicas

- **Node.js ≥ 22.5** es obligatorio — versiones anteriores no incluyen el módulo `node:sqlite`
- No usar gestores de estado externos (Redux, Zustand) — el estado global se gestiona con React Context API
- No agregar ORMs ni clientes SQLite de terceros (`better-sqlite3`, `sqlite3`) — usar exclusivamente `node:sqlite` nativo
- No introducir frameworks CSS externos — mantener estilos en `index.css` vanilla
- El CDK app debe permanecer en Python; no migrar a TypeScript CDK
- Las dependencias de producción del Lambda deben instalarse con `--omit=dev` para mantener el bundle ligero
