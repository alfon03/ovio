# OVIO Beta v1.6

- Corregida redeclaración de `e` en `BetaSupport.jsx`, que bloqueaba `vite build`.
- Añadido **Mis letras privadas** en el menú Creadores y en Studio para artistas aprobados.
- Nueva tabla privada `artist_lyric_drafts` y migración `013_lyrics_private.sql` con RLS, accesos de columna y comprobación de autoría de canciones asociadas.
- CRUD privado: crear, ver, editar, borrar y vincular letras a tus canciones (sin publicación).
- Añadido manifest PWA, service worker que solo cachea recursos estáticos públicos, página sin conexión e instalación desde el perfil cuando esté disponible.
- Añadidos favicon SVG, ICO, PNG 16/32/48, iconos 192/512, variantes maskable y Apple touch icon.
- Proyecto distribuido sin `.git`, `node_modules`, `dist` ni `.env.local`, conservando las migraciones SQL y tests.
- Incrementada la versión del proyecto a `1.6.0`.
