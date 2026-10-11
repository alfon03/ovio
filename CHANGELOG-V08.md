# Cambios OVIO Beta v0.8

## Reproductor

- Cola contextual que conserva el orden visible de las canciones de una playlist.
- Cola de reproducción con añadido como siguiente, quitar pendientes y moverlas de posición.
- Aleatorio sin repetición dentro de una misma cola y tres modos de repetición (`off`, `all`, `one`).
- Anterior (si han transcurrido más de 3 s, comienza la canción actual) y siguiente.
- Reproductor ampliado para móvil con barra de búsqueda, modos y volumen.
- Corrección de solicitudes de reproducción concurrentes: solo la más reciente puede iniciar el audio.

## Seguir escuchando (opcional)

- Nuevo ajuste **desactivado por defecto** en Perfil.
- Sincronización privada por usuario/canción con Supabase, por posiciones de reproducción significativas.
- Guardado aproximadamente cada 20 segundos, al pausar y al cambiar de canción.
- La canción terminada desaparece de los pendientes; los usuarios pueden borrar todo al desactivar.
- Funciona de forma independiente de las estadísticas y del resumen anual.

## Archivos

- Nuevo: `src/player-queue.js`, `tests/player-queue.test.js`, `sql/007_reproductor_y_progreso.sql`.
- Modificados: `src/App.jsx`, `src/style.css`, `package.json`.

**Importante:** no se cambia la lógica de regalías (la beta sigue sin pagos ni anuncios); no hay cambios en migraciones anteriores ni se borran tablas existentes.
