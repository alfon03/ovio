# OVIO v1.9 — Plan de pruebas de estabilidad

## Antes de publicar

- [ ] `npm test` pasa.
- [ ] `npm run check:deploy` indica OK.
- [ ] `npm run build` termina correctamente.
- [ ] `.env.local` no se sube a GitHub.

## Pruebas funcionales con cuentas secundarias

1. **Reproducción:** escucha una canción 35 segundos, cambia de canción y confirma que la reproducción sigue funcionando y que tus favoritos y listas siguen visibles.
2. **Rendimiento:** abre las herramientas de desarrollo → Network → Fetch/XHR; después de 30 segundos escuchando una canción, no debería haber una recarga masiva de las consultas iniciales de catálogo. La inserción en `listen_events` es normal.
3. **Cierre desde otra pestaña:** inicia sesión en dos pestañas, reproduce una canción en la primera y cierra sesión en la segunda; al propagarse el evento de Auth, la primera debe detener el sonido y mostrar el login.
4. **Cambios rápidos:** entra y sal con dos cuentas distintas; nunca deberían verse temporalmente incidencias, letras, estadísticas o paneles de administración de la otra cuenta.
5. **Conexión lenta:** desde Network/Throttling simula red lenta mientras actualizas datos y cambias de pantalla. La aplicación no debe quedarse permanentemente en «Actualizando contenido».
6. **Regresión de funciones:** Explorar, Creadores, Moderación, letras privadas, incidencias, favoritos, playlists, rankings, PWA y recuperación de contraseña.
7. **Móvil/PWA:** comprueba que abre y que no se descargan canciones para uso offline. Tras actualizar, prueba cerrar y abrir la aplicación instalada para cargar recursos nuevos.
8. **Cuenta admin y oyente:** verifica que los permisos reales de Supabase siguen bloqueando acciones no autorizadas (RLS).

## Antes de invitar personas externas

Resolver textos legales, procedimiento de retirada por derechos musicales, política de privacidad, consentimiento y envío SMTP; decidir cómo controlar el acceso beta. Confirmar que el nombre comercial y el uso de Vercel/Supabase son adecuados.
