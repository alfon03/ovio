# OVIO Beta v1.3 — lista para preparar el despliegue

## En local

```bash
npm install
npm test
npm run check:deploy
npm run build
npm run dev
```

La aplicación requiere `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, tal como en `.env.example`. Nunca publiques `.env`.

## Publicar

Sigue **[DEPLOY-BETA-V13.md](DEPLOY-BETA-V13.md)** para Vercel, protección de la beta y Supabase Auth. **No requiere SQL nuevo**. Los datos existentes se mantienen.

## Importante

Publicar un sitio no significa que esté listo para aceptar usuarios reales. La beta debe seguir protegida mientras se revisan permisos, legalidad de la música, textos de privacidad, denuncias y la marca comercial OVIO.
