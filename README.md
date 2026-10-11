# OVIO — Beta v1.8

Plataforma independiente de música hecha con React, Vite y Supabase, publicada en Vercel.

## Qué cambia en v1.8

- **Explorar renovado**: estrenos recientes, géneros con canciones reales, sugerencias, joyas ocultas, artistas seguidos y búsqueda en el catálogo.
- **Reproductor más resistente**: estados de conexión y carga, reintento manual si falla una fuente, y controles del sistema operativo mediante Media Session cuando están disponibles.
- **Responsive**: interfaz de exploración adaptada a móvil y PWA.
- **Respeta la privacidad**: no cambia políticas RLS, no comparte borradores de letras, no incorpora estadísticas sin consentimiento y no guarda audios offline.

## Instalación y pruebas

Consulta [INSTALAR-V18.md](./INSTALAR-V18.md) y [PRUEBAS-V18.md](./PRUEBAS-V18.md). Esta versión es compatible con OVIO v1.7 y **no necesita SQL**.

```bash
npm ci
npm test
npm run check:deploy
npm run build
```

Para `check:deploy` son necesarias tus variables públicas de Supabase en `.env.local` (o el entorno). **Nunca subas** ese archivo ni claves secretas al repositorio.

## Estado de validación

Las pruebas unitarias y la comprobación de sintaxis JS/JSX se han ejecutado en este entorno. No se ha podido completar `npm run build` aquí porque `npm ci` no consiguió descargar las dependencias desde npm. Ejecuta la compilación local antes de enviar el proyecto a Vercel; la integración con Supabase y la reproducción real también deben verificarse en tus dispositivos.
