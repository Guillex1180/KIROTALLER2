# KIROTALLER2 — ShopKiro Steering Docs

Documentos de dirección (steering) para el proyecto **ShopKiro**, una aplicación de e-commerce full-stack desplegada en AWS con CDK.

## Estructura

```
.kiro/steering/
├── product.md          # Propósito, usuarios objetivo y características del producto
├── tech.md             # Stack tecnológico, versiones y restricciones técnicas
├── structure.md        # Organización de carpetas, convenciones y patrones arquitectónicos
├── python-venv.md      # Guía del entorno virtual Python y comandos CDK
├── cdk-deploy.md       # Flujo completo de build y despliegue en AWS
├── api-contracts.md    # Contratos REST API con ejemplos de request/response
└── db-schema.md        # Esquema SQLite completo con tipos y patrones de consulta
```

## Stack

- **Frontend**: React 18 + Vite + React Router 6
- **Backend**: Node.js 22 + Express + SQLite (`node:sqlite` nativo)
- **Infra**: AWS CDK (Python) → S3 + CloudFront + API Gateway HTTP + Lambda Node 22

## Uso

Estos archivos son leídos automáticamente por Kiro IDE en cada sesión para mantener contexto persistente del proyecto sin necesidad de repetir instrucciones.
