# Product Overview — ShopKiro

## Propósito

ShopKiro es una aplicación de e-commerce full-stack de tres capas construida como proyecto de aprendizaje y demostración en el contexto del taller Kiro AWS. El objetivo es ilustrar cómo desplegar una aplicación web moderna completa en AWS usando infraestructura como código (IaC) con AWS CDK.

## Usuarios Objetivo

- Desarrolladores que aprenden arquitecturas serverless en AWS
- Equipos que evalúan el flujo de trabajo con Kiro IDE y AWS CDK
- Instructores y participantes de talleres técnicos de AWS

## Características Clave

### Catálogo de Productos
- Listado de 20 productos con imagen (emoji), nombre, precio, rating y categoría
- Búsqueda en tiempo real con debounce sobre nombre, descripción y categoría
- Filtro por categoría mediante pills interactivos
- Estados de carga tipo skeleton para mejor UX

### Detalle de Producto
- Descripción completa, precio y estado de stock
- Selector de cantidad con límite según stock disponible
- Sección de reseñas de clientes con ratings en estrellas y avatares

### Carrito de Compras
- Gestión de sesión por usuario mediante `X-Session-ID` en cabeceras HTTP
- Actualización de cantidades en tiempo real (incremento/decremento)
- Eliminación de ítems individuales o vaciado completo del carrito
- Resumen con subtotal, impuesto estimado (8%), envío gratis y total
- Flujo de checkout simulado con pantalla de confirmación de orden

## Objetivos Comerciales / del Proyecto

1. Demostrar una arquitectura AWS serverless de producción: S3 + CloudFront (frontend) + API Gateway HTTP + Lambda (backend)
2. Servir como plantilla de referencia para proyectos full-stack desplegados con CDK en Python
3. Mostrar el ciclo completo de desarrollo con Kiro IDE: desde el código hasta el despliegue en AWS

## Restricciones y Alcance

- No incluye autenticación de usuarios (el carrito se gestiona por sesión anónima)
- El checkout es simulado — no hay integración con pasarelas de pago reales
- La base de datos SQLite en Lambda es efímera (`/tmp`); se re-siembra en cada cold start
- Diseñado para demos y talleres, no para carga de producción de alto volumen
