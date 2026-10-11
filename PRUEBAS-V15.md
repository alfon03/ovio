# OVIO Beta v1.5 — Pruebas de aceptación

## Cuenta normal

- [ ] Accede a **Primeros pasos**.
- [ ] Al configurar su nombre de usuario, la primera tarea se marca como completada.
- [ ] Al guardar una canción favorita, se actualiza el progreso.
- [ ] Al crear una playlist, se actualiza el progreso.
- [ ] Al seguir un artista aprobado, se actualiza el progreso.
- [ ] **Enviar comentario** abre Ayuda y sugerencias.
- [ ] No aparece **Panel del piloto** en el menú.
- [ ] Intentar ejecutar `get_ovio_pilot_overview` con su JWT desde la API devuelve denegación de acceso.

## Administrador

- [ ] Puede entrar en **Panel del piloto**.
- [ ] Las cifras de usuarios, artistas y canciones coinciden con el estado de las tablas.
- [ ] Las incidencias abiertas/resueltas coinciden con el panel de soporte.
- [ ] Puede ir a Moderación y a Comentarios beta.
- [ ] Si no existen datos de escucha consentidos, aparecen ceros y el aviso de datos parciales.

## Regresiones

- [ ] `npm test` y `npm run build` terminan sin errores.
- [ ] Login, confirmación de email y restablecimiento funcionan.
- [ ] Subida de canción queda pendiente; solo admin puede aprobar.
- [ ] Reproductor, favoritos, álbumes y playlists siguen funcionando.
- [ ] Móvil: barra inferior, navegación y tarjetas sin desbordamiento.
