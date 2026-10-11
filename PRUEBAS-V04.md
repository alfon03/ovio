# OVIO v0.4 — Lista de pruebas manuales

Prueba primero en un entorno de desarrollo y haz copia de seguridad.

## A. Migración

- [ ] Supabase SQL Editor muestra `Success` al ejecutar `003_notificaciones_catalogo.sql`.
- [ ] Table Editor → existe `public.notifications`.
- [ ] El esquema mantiene `tracks`, `artist_applications`, `releases`, `likes`, `playlists` y los usuarios anteriores.
- [ ] Con los datos anteriores, OVIO sigue pudiendo iniciar sesión, reproducir canciones aprobadas y abrir playlists.

## B. Cuenta de artista y administrador

Usa dos cuentas de navegador distintas: una administradora y otra de prueba. **No compartas UUID o credenciales en capturas públicas.**

- [ ] Cuenta de prueba: solicitar ser artista.
- [ ] Administrador: aprobar la solicitud.
- [ ] Cuenta de prueba: volver a la app, pulsar Actualizar en Notificaciones y comprobar el aviso de aprobación.
- [ ] Comprobar que aparece el número en la campana.
- [ ] Marcar el aviso como leído y comprobar que baja el contador.
- [ ] El artista sube una canción original con declaración de derechos.
- [ ] Administrador: rechazarla con motivo de al menos diez caracteres.
- [ ] Artista: comprueba aviso con motivo y el estado en OVIO Studio.
- [ ] Repetir con otra canción aprobada; el aviso debe ser distinto.
- [ ] Una canción aprobada queda disponible en Buscar; una rechazada no.

## C. Catálogo

- [ ] El buscador de Studio filtra canciones del artista.
- [ ] Los filtros Pendientes / Aprobadas / Rechazadas funcionan.
- [ ] Una canción pendiente permite cambiar título, género y número de pista si forma parte de un álbum.
- [ ] Tras editarla, el estado sigue siendo Pendiente y no se modifica el archivo.
- [ ] Una canción aprobada NO muestra botón de edición, y la base de datos impide editarla con el RPC.

## D. Seguridad indispensable

- [ ] Con una cuenta A iniciada, no se pueden leer notificaciones de la cuenta B usando la API pública.
- [ ] Una cuenta no puede insertar directamente filas en `notifications` mediante el cliente Supabase.
- [ ] Una cuenta no puede editar los metadatos de una canción ajena mediante `update_my_pending_track`.
- [ ] El cliente no puede cambiar directamente `status`, `review_note` o `audio_path` de una canción.
- [ ] Los buckets `song-audio` y `song-evidence` siguen privados.

## Solución de problemas

- **`Could not find the table public.notifications`**: ejecutar la migración nueva y actualizar caché del esquema (a veces espera unos instantes o reinicia el navegador).
- **`permission denied`**: no uses credenciales secretas en la web; revisa que ejecutaste todo el SQL y que la sesión esté iniciada.
- **La campana no se actualiza al instante**: esta versión no usa push. Pulsa Actualizar en Notificaciones, cambia de pestaña y vuelve, o espera un minuto con la app visible.
- **No aparecen avisos antiguos**: solo se crean al cambiar el estado **después** de ejecutar `003`.
- **La edición falla**: solo funciona para canciones `pending` de tu usuario, con metadatos válidos y migración aplicada.
