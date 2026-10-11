# OVIO v1.3 — Despliegue beta

- `vercel.json`: build Vite y rewrite SPA.
- `scripts/check-deploy.mjs`: comprobación local de variables de entorno (sin mostrar secretos), versión Node y rutas.
- `tests/deployment.test.js`: validaciones de configuración.
- `public/robots.txt` + `noindex`: evita la indexación de la beta (no es un mecanismo de seguridad).
- `.gitignore` actualizado para evitar publicar archivos `.env.*` y `.vercel`.
- Documentación paso a paso en `DEPLOY-BETA-V13.md`.
- Ninguna migración SQL y sin cambios de las funciones de OVIO.
