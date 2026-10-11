# OVIO Beta v1.5 · Piloto privado

Actualización incremental para tu proyecto React + Supabase + Vercel (sin crear una nueva base de datos).

## Novedades

- **Primeros pasos**, un recorrido que utiliza información real de la cuenta (usuario, favoritos, playlists, artistas seguidos).
- **Panel del piloto**, resumen privado para administradores con cuentas, solicitudes, canciones, incidencias y estadísticas agregadas consentidas.
- Migración única `sql/012_panel_piloto.sql`, con comprobación de autorización administrativa dentro de la función PostgreSQL.
- Registro y permisos existentes **sin cambios**; la beta no se abre automáticamente al público.

**Empieza por [INSTALAR-V15.md](INSTALAR-V15.md)**, continúa con [PRUEBAS-V15.md](PRUEBAS-V15.md).

Pruebas unitarias en este entorno: **60 correctas**. Sintaxis JSX validada. Compilación final con Vite y pruebas en tu Supabase pendientes; `npm install` no pudo acceder a npmjs.org desde este entorno.
