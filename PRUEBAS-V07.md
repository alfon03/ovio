# OVIO Beta v0.7 — Plan de pruebas

## Instalación

- [ ] Crear copia de seguridad del proyecto Supabase y del código actual.
- [ ] Ejecutar únicamente `sql/006_artist_insights.sql` en el editor SQL de Supabase.
- [ ] Incorporar `App.jsx`, `style.css`, `ArtistInsights.jsx`, `artist-insights.js`.
- [ ] Mantener el `.env` anterior; `npm run build` no muestra errores y `npm test` pasa.

## Pruebas con cuentas

1. Entrar como **oyente normal**: no debería aparecer **Mis estadísticas** y, si intenta acceder por interfaz a esa página, verá una explicación y no los datos del artista.
2. Entrar como **artista pendiente**: tampoco debería ver números de rendimiento.
3. Entrar como **artista aprobado**: abrir Studio → **Ver mis estadísticas completas**.
4. Si no tiene canciones aprobadas, aparecen totales reales a cero y el mensaje de estado vacío.
5. Publicar una canción propia mediante aprobación del moderador.
6. Entrar con **otro oyente**, ir a Perfil → Privacidad y estadísticas y activar voluntariamente el seguimiento; reproducir la canción más de 30 segundos y dejar unos segundos para sincronización.
7. Volver a la cuenta del artista y pulsar **Actualizar**: si la sesión se registró, el panel reflejará al menos una reproducción válida, oyente y minutos conforme a los datos disponibles.
8. Cambiar entre 1, 3, 6 y 12 meses, y entre Reproducciones, Oyentes y Minutos: comprobar consistencia de totales y tendencias.
9. Desactivar el seguimiento del oyente (con confirmación de borrado): tras actualizar el panel del artista, sus reproducciones/minutos correspondientes deben desaparecer.
10. Verificar que una cuenta de artista **no puede** leer datos de las canciones de otro artista; revisar RPC como otro usuario desde la aplicación (no desde SQL Editor de superusuario).

## Revisión de seguridad

- [ ] El RPC no recibe un `artist_id` elegido por el cliente: usa `auth.uid()`.
- [ ] Se mantienen los permisos existentes y las pistas pendientes no se cuentan.
- [ ] Solo muestra métricas agregadas, sin IDs, nombres o correos de oyentes.
- [ ] Las estadísticas solo empiezan cuando los usuarios dan su consentimiento.
- [ ] Se explican los límites antifraude y no se utiliza para pagos.

Si falla alguna prueba, copia **solo el mensaje de error**, sin contraseñas ni claves secretas.
