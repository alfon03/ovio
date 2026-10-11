# OVIO — Beta v1.7

Plataforma musical independiente desarrollada con React, Vite y Supabase y desplegable en Vercel.

## Nuevas mejoras de v1.7

- **Menú Explorar desplegable**, abierto por defecto. Incluye Inicio, Buscar, Descubrir, Biblioteca, Comunidad, Top OVIO, Recap, primeros pasos y ayuda.
- **Menú Creadores desplegable**, con OVIO Studio, letras privadas y estadísticas (solo para artistas aprobados) y notificaciones.
- **Menú Moderación separado y desplegable** para administradores, con revisión de contenido, comentarios beta y panel del piloto.
- Menú lateral **desplazable** para que no se corten opciones en pantallas pequeñas.
- Diseño adaptado a tabletas y teléfonos: panel lateral con apertura/cierre, fondo oscurecido, tecla Escape, tamaños táctiles y áreas seguras de iPhone.
- Estados accesibles (`aria-expanded`, `aria-current`, foco) y soporte para movimiento reducido.
- Se conservan el reproductor, los borradores privados de letras, las funciones PWA, registro, analíticas, listas y moderación.

## Actualización desde v1.6

Lee [INSTALAR-V17.md](./INSTALAR-V17.md) y sigue las pruebas de [PRUEBAS-V17.md](./PRUEBAS-V17.md).

**Esta versión no necesita nuevas migraciones SQL**. Se instala en la misma aplicación de Vercel y con el mismo proyecto Supabase.

```bash
npm ci
npm test
npm run check:deploy
npm run build
```

`check:deploy` requiere variables VITE_ válidas en el entorno local. Conservar tu `.env.local` actual; no distribuirlo ni guardarlo en Git. Nunca usar claves secretas o `service_role` en el frontend.

## Estado

- 71 pruebas unitarias completadas correctamente.
- Sintaxis JS/JSX validada.
- La compilación Vite de producción debe completarse en el ordenador o Vercel: este entorno no puede acceder al registro de paquetes npm.
- No se han probado sesiones reales con tu Supabase desde este entorno.
