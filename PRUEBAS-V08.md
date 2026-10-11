# OVIO Beta v0.8 — Plan de pruebas (reproductor y progreso)

## Preparación

1. Haz una copia de tu proyecto y un respaldo de tu base de datos.
2. Aplica exclusivamente `sql/007_reproductor_y_progreso.sql` en tu Supabase de desarrollo. Las migraciones 001–006 ya deben existir.
3. Incorpora `src/App.jsx`, `src/style.css` y **nuevo** `src/player-queue.js` desde este paquete; mantén `.env`, tus claves públicas y cualquier personalización propia.
4. Ejecuta `npm install`, `npm test`, `npm run build`, `npm run dev`.
5. Prueba con dos cuentas reales y **canciones aprobadas con audio accesible**. El administrador debe conservar su acceso.

## Pruebas de reproductor

- [ ] Abrir una playlist con tres canciones aprobadas. Pulsar «Reproducir lista»: suena la primera.
- [ ] Pulsar siguiente/atrás: el orden es el de la playlist que se muestra, no el catálogo global.
- [ ] En modo repetir **off**, al terminar la última canción la reproducción se detiene.
- [ ] En modo repetir **all**, al acabar la última canción vuelve a la primera.
- [ ] En modo repetir **one**, al terminar vuelve a reproducirse la misma canción.
- [ ] Activar aleatorio: conserva la canción actual y reordena las pendientes, sin duplicados dentro de la cola.
- [ ] Pulsar «Añadir a cola» en una canción que no estuviera: aparece en «Cola» como siguiente.
- [ ] Abrir «Cola», subir y bajar una canción pendiente y quitarla. No se puede eliminar la que suena.
- [ ] En pantalla estrecha, tocar la portada del reproductor inferior abre la vista completa con progreso, volumen y modos.
- [ ] Cambiar de canción varias veces rápido y comprobar que solo suena la última seleccionada.

## «Seguir escuchando» y privacidad

- [ ] En Perfil el ajuste está **desactivado por defecto**.
- [ ] Al activarlo, escuchar más de 20 segundos de una canción de más de 25 segundos y pausar.
- [ ] Al recargar o iniciar sesión con la misma cuenta en otro dispositivo, «Seguir escuchando» ofrece ese tema y posición aproximada.
- [ ] Al alcanzar el final de la canción se elimina el marcador.
- [ ] Desactivar el ajuste borra los marcadores y no crea nuevos.
- [ ] Dos usuarios distintos no pueden leer o editar los marcadores del otro (RLS).
- [ ] Desactivar «Seguir escuchando» **no** altera el consentimiento del resumen anual o de los rankings.
- [ ] Las canciones rechazadas o retiradas no aparecen en «Seguir escuchando».

## Comprobación de permisos (en Supabase)

Desde una sesión autenticada puedes observar la tabla `playback_bookmarks`. Sus políticas RLS garantizan que el navegador solo pueda leer filas de su usuario. No desactives RLS ni utilices `service_role` desde el frontend.

## Limitaciones conocidas

- El historial previo a la v0.8 no tiene posiciones de reproducción y no se recupera retroactivamente.
- La cola y los modos aleatorio/repetir son del dispositivo y sesión actual; el progreso entre dispositivos se guarda **solo si se activa** en Perfil.
- Los enlaces firmados de audio vencen; para un reproductor 24/7 harán falta renovación de URLs y pruebas de redes inestables.
- La sincronización entre dispositivos puede mostrar un punto ligeramente anterior: se guarda aproximadamente cada 20 segundos y al pausar o cambiar.
- La cola no se comparte ni sincroniza entre varios dispositivos.
- Este paquete no ha sido desplegado ni integrado contra tu Supabase; las pruebas unitarias no equivalen a una prueba end-to-end.

## Si aparece un error

- `relation "public.playback_preferences" does not exist`: falta ejecutar SQL 007.
- `permission denied` o política de filas (RLS): verifica que el usuario haya iniciado sesión y que las políticas de SQL 007 se hayan aplicado.
- No reproduce audio: comprueba que la canción está aprobada, que existe `audio_path` y que la política de lectura del bucket `song-audio` permite emitir URL firmada bajo las condiciones anteriores.
- Error de compilación: copia el mensaje exacto de `npm run build` y verifica que `src/player-queue.js` esté presente.
