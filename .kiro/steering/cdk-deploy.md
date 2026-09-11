---
inclusion: auto
name: cdk-deploy
description: Flujo completo de build y despliegue de ShopKiro en AWS con CDK, incluyendo subida de assets al S3 e invalidación de CloudFront
---

# Flujo de Despliegue — ShopKiro en AWS

## Visión general

```
[React build] → [S3 bucket] → [CloudFront CDN]
                                      ↕
                [Lambda Node 22] ← [API Gateway HTTP]
```

El CDK gestiona toda la infraestructura. El deploy manual solo requiere tres pasos: build del frontend, sync a S3 e invalidar CloudFront.

---

## Paso 1 — Desplegar la infraestructura (primera vez o tras cambios en CDK)

```bash
# Desde la raíz del proyecto
source .venv/bin/activate
cdk deploy
```

Al finalizar, CDK muestra y guarda en `cdk-outputs.json`:

```json
{
  "KirotallerStack": {
    "BackendURL": "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com",
    "FrontendURL": "https://xxxxxxxxxxxx.cloudfront.net",
    "FrontendBucketName": "kirotaller-frontendbucket-xxxxxxxxxxxx",
    "CloudFrontDistributionId": "XXXXXXXXXXXXXX"
  }
}
```

Guarda estos valores — los necesitas en los pasos siguientes.

---

## Paso 2 — Build del frontend

```bash
cd ecommerce/client

# Reemplaza <BackendURL> con el valor de cdk-outputs.json
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com npm run build
```

El build genera `ecommerce/client/dist/` con los assets estáticos listos para producción.

---

## Paso 3 — Subir assets a S3

```bash
# Reemplaza <FrontendBucketName> con el valor de cdk-outputs.json
aws s3 sync dist/ s3://kirotaller-frontendbucket-xxxxxxxxxxxx --delete
```

El flag `--delete` elimina del bucket los archivos que ya no existen en el build local.

---

## Paso 4 — Invalidar caché de CloudFront

```bash
# Reemplaza <CloudFrontDistributionId> con el valor de cdk-outputs.json
aws cloudfront create-invalidation \
  --distribution-id XXXXXXXXXXXXXX \
  --paths "/*"
```

La invalidación puede tardar 1-2 minutos en propagarse globalmente.

---

## Script completo (copy-paste)

```bash
# Leer outputs del último deploy
BACKEND_URL=$(cat cdk-outputs.json | python3 -c "import sys,json; print(json.load(sys.stdin)['KirotallerStack']['BackendURL'])")
BUCKET=$(cat cdk-outputs.json | python3 -c "import sys,json; print(json.load(sys.stdin)['KirotallerStack']['FrontendBucketName'])")
DIST_ID=$(cat cdk-outputs.json | python3 -c "import sys,json; print(json.load(sys.stdin)['KirotallerStack']['CloudFrontDistributionId'])")

# Build
cd ecommerce/client
VITE_API_URL=$BACKEND_URL npm run build

# Deploy assets
aws s3 sync dist/ s3://$BUCKET --delete

# Invalidar cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo "✅ Deploy completo. App disponible en: $(cat ../../cdk-outputs.json | python3 -c \"import sys,json; print(json.load(sys.stdin)['KirotallerStack']['FrontendURL'])\")"
```

---

## Solo cambios en el backend (Lambda)

Si solo modificaste código del servidor Express:

```bash
source .venv/bin/activate
cdk deploy    # Re-bundlea y despliega solo la función Lambda
```

CDK detecta automáticamente qué recursos cambiaron.

---

## Solo cambios en el frontend

Si solo modificaste código React (sin tocar CDK):

```bash
# Pasos 2, 3 y 4 únicamente — sin cdk deploy
cd ecommerce/client
VITE_API_URL=<BackendURL> npm run build
aws s3 sync dist/ s3://<FrontendBucketName> --delete
aws cloudfront create-invalidation --distribution-id <CloudFrontDistributionId> --paths "/*"
```

---

## Limpiar todos los recursos AWS

```bash
source .venv/bin/activate
cdk destroy
```

Elimina el stack completo (S3, CloudFront, Lambda, API Gateway). El bucket S3 se vacía automáticamente gracias a `auto_delete_objects=True` en el CDK stack.
