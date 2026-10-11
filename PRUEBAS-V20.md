# OVIO v2.0 — Pruebas obligatorias de beta abierta

Marca cada caso al realizarlo en la web HTTPS publicada, con una cuenta de pruebas por rol.

## 1. Acceso abierto (oyente nuevo)

- [ ] Una persona nueva puede registrarse sin invitación.
- [ ] La confirmación por correo es obligatoria; el enlace vuelve al dominio HTTPS correcto.
- [ ] Dos cuentas no pueden elegir el mismo `@usuario` con distinto uso de mayúsculas.
- [ ] Un correo o contraseña incorrectos no revelan datos de otra persona.
- [ ] La recuperación por correo funciona y la contraseña antigua deja de servir.
- [ ] CAPTCHA opcional: completar desafío permite registrar, entrar y recuperar. Sin desafío **no** se puede enviar la solicitud cuando está configurado el sitekey.
- [ ] Con CAPTCHA activado en Supabase, un login antiguo sigue funcionando tras un desafío válido.

## 2. Separación de cuentas y roles (hacerlo con dos cuentas y un administrador)

- [ ] Oyente A no puede leer los borradores de letras de artista B ni cambiando parámetros de API.
- [ ] Artista A no puede asociar un borrador a una canción de artista B.
- [ ] Oyente A no puede aprobarse artista ni aprobar/modificar canciones pendientes.
- [ ] Cuenta no administradora no puede asignarse rol de administrador.
- [ ] Una canción pendiente/rechazada no aparece en Explorar ni se escucha con una URL firmada obtenida por otra cuenta.
- [ ] Oyente A no puede editar las playlists privadas ni las incidencias de soporte de oyente B.
- [ ] La sesión cerrada en otra pestaña deja de mostrar datos privados al actualizar y se detiene la reproducción.
- [ ] Moderador puede revisar evidencias y aprobar/rechazar canciones; la decisión se refleja al artista.

## 3. Archivos y privacidad

- [ ] El SQL de auditoría muestra buckets privados `song-audio` y `song-evidence`.
- [ ] Las portadas/avatares sí se muestran con permisos esperados.
- [ ] Una cuenta no administradora no puede leer pruebas de autoría ajenas.
- [ ] La PWA funciona al instalarla, pero no almacena letras, documentos ni música privada sin conexión.
- [ ] Al cerrar sesión, los datos privados ya no quedan visibles en otra cuenta.

## 4. Funcionamiento real

- [ ] Reproductor: cola, repetición, modo aleatorio, pausar y reintentar con pérdida temporal de red.
- [ ] Explorar presenta solo música aprobada, sin datos ficticios.
- [ ] Artista nuevo puede enviar solicitud, subir música original y recibir estado de moderación.
- [ ] Se pueden enviar incidencias; solo su remitente y administrador pueden consultarlas.
- [ ] El panel de piloto muestra cifras agregadas y no expone historiales personales.
- [ ] Mobile 360px / 390px, tableta y ordenador: navegación, formularios y PWA sin desbordamiento.

## 5. Preparación operativa

- [ ] `npm ci`, `npm test`, `npm run check:deploy`, `npm run check:beta`, `npm run build` terminan bien.
- [ ] Vercel Production aparece `Ready` y la aplicación carga sin errores de consola.
- [ ] SMTP y los límites de Auth están revisados para uso público.
- [ ] Hay procedimiento de retirada de música por reclamación y cuenta de administrador custodiada.
- [ ] La marca comercial, privacidad y condiciones de uso se han revisado antes de ampliar el lanzamiento.

**Estas pruebas requieren interacción real con Supabase y Vercel.** Las pruebas Node y la auditoría estructural SQL no acreditan por sí solas la seguridad de producción.
