# Pruebas manuales de OVIO v1.7

## Navegación

- [ ] Al abrir sesión aparece **Explorar** desplegado automáticamente con **Inicio**, **Buscar**, **Descubrir**, **Tu biblioteca**, **Comunidad**, etc.
- [ ] Al pulsar **Explorar** se ocultan sus opciones; al pulsarlo de nuevo reaparecen.
- [ ] **Creadores** se puede desplegar y contraer; contiene OVIO Studio y Notificaciones.
- [ ] Un artista aprobado también ve **Mis letras privadas** y **Mis estadísticas**.
- [ ] Al navegar a una pantalla del grupo desde otro acceso (p. ej. campana de notificaciones), el desplegable correspondiente se abre.
- [ ] Una cuenta normal no ve **Moderación** ni puede acceder a funciones administrativas.
- [ ] La cuenta de administrador ve **Moderación** por separado con **Revisión de contenido**, **Comentarios beta** y **Panel del piloto**.

## Responsividad

- [ ] A ~1440 px se ve la barra lateral y el reproductor no tapa las opciones.
- [ ] A ~820 px aparece un botón para abrir el menú y el contenido utiliza el ancho disponible.
- [ ] A ~390 px el menú lateral se abre, permite hacer scroll y se cierra al pulsar el fondo oscuro.
- [ ] Al pulsar una opción el menú se cierra y se muestra la pantalla seleccionada.
- [ ] La tecla Escape cierra el menú (teclado físico), y el foco vuelve al botón de menú.
- [ ] Los botones de la navegación inferior y el reproductor funcionan en móviles pequeños.
- [ ] No hay desplazamiento horizontal no deseado en Studio, Letras, Biblioteca, Moderación y Soporte.
- [ ] La PWA instalada y el navegador muestran el mismo menú actualizado después de recargar/abrir de nuevo.

## Regresión

- [ ] Inicio de sesión, alta y recuperación de contraseña siguen funcionando.
- [ ] Reproducción, playlists y favoritos funcionan.
- [ ] Los borradores privados de letras siguen guardándose sin publicarse.
- [ ] Subida y revisión de canciones siguen funcionando con permisos correctos.

No se modifica ninguna tabla de Supabase. Las pruebas unitarias locales deben mostrar **71 pruebas superadas**.
