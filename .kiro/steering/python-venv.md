---
inclusion: fileMatch
fileMatchPattern: "**/*.py|requirements*.txt|cdk.json|app.py"
---

# Guía del Entorno Python (CDK)

## Requisitos previos

- Python 3.x instalado (`python3 --version`)
- AWS CLI configurado (`aws configure`)
- AWS CDK CLI instalado (`npm install -g aws-cdk`)

---

## Crear el entorno virtual (primera vez)

```bash
# Desde la raíz del proyecto (KIROTALLER/)
python3 -m venv .venv
```

## Activar el entorno virtual

```bash
# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate.bat
```

El prompt cambia a `(.venv)` cuando está activo. **Siempre debe estar activo antes de ejecutar comandos CDK.**

## Instalar dependencias

```bash
pip install -r requirements.txt
```

Para dependencias de desarrollo (linters, testing):
```bash
pip install -r requirements-dev.txt
```

---

## Comandos CDK esenciales

Todos requieren el entorno virtual activo:

```bash
cdk ls          # Lista todos los stacks disponibles
cdk synth       # Genera el CloudFormation template (sin desplegar)
cdk diff        # Compara el estado actual vs el desplegado en AWS
cdk deploy      # Despliega el stack en AWS
cdk destroy     # Elimina todos los recursos del stack de AWS
```

## Variables de entorno necesarias para el deploy

CDK las lee automáticamente de la sesión AWS CLI:

```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)
```

---

## Estructura del CDK app

```
app.py                      # Punto de entrada — instancia KirotallerStack
kirotaller/
└── kirotaller_stack.py     # Define S3, CloudFront, Lambda, API Gateway
```

- Agregar nuevos recursos AWS siempre dentro de `KirotallerStack.__init__`
- Los outputs (`CfnOutput`) se guardan en `cdk-outputs.json` tras el deploy
- El archivo `cdk.context.json` es generado por CDK — no editarlo manualmente

---

## Solución de problemas comunes

| Problema | Solución |
|---|---|
| `cdk: command not found` | `npm install -g aws-cdk` |
| `No module named aws_cdk` | Activar `.venv` y ejecutar `pip install -r requirements.txt` |
| `Unable to resolve AWS account` | Ejecutar `aws configure` o exportar `CDK_DEFAULT_ACCOUNT` |
| Error de bootstrap | `cdk bootstrap aws://<account>/<region>` (solo primera vez por cuenta/región) |
