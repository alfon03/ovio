# OVIO v1.2 — Pruebas con cuentas reales (obligatorias)

Marca cada verificación solo después de ejecutarla desde la app/API con la sesión indicada, no desde el editor SQL del administrador.

## Cuentas de prueba

- A: oyente normal con correo confirmado.
- B: artista aprobado con 1 canción pendiente y 1 aprobada.
- C: administrador autorizado en `admin_users`.
- D: ventana anónima sin iniciar sesión.

## Seguridad y privacidad

- [ ] A no puede abrir la sección de moderación ni actualizar el estado de B.
- [ ] A no puede consultar el registro privado de derechos/evidencias subido por B mediante Storage (RLS lo bloquea).
- [ ] B sí puede acceder a SU propio archivo de evidencia y C también para moderar.
- [ ] D no puede acceder a audios privados ni a documentos de evidencia mediante URL directa de Storage (sin un enlace firmado).
- [ ] A no puede consultar ni modificar las playlists privadas de B.
- [ ] A no puede modificar el perfil ni la foto de B en la base de datos.
- [ ] A no puede añadir la canción pendiente de B a una playlist (aprobada sí).
- [ ] B no puede aprobar ni rechazar sus propias canciones ni solicitudes.
- [ ] C puede aprobar o rechazar y se generan los avisos adecuados al artista.
- [ ] B puede editar los metadatos de una canción pendiente, pero no modificar los de una aprobada.
- [ ] El bucket `song-audio` y el bucket `song-evidence` figuran como privados.

## Funciones existentes

- [ ] Confirmación de correo, inicio/cierre de sesión y recuperación de contraseña funcionan.
- [ ] Los nombres de usuario y artísticos siguen siendo únicos.
- [ ] El reproductor abre música aprobada con enlace temporal sin exponer evidencias.
- [ ] Crear/editar álbum, subir single, generar playlists y ver estadísticas siguen funcionando.
- [ ] `npm test` y `npm run build` funcionan en el proyecto local.

## Antes de abrir la beta

- [ ] Restringir admisión si la beta se anuncia «por invitación» (un enlace secreto NO basta).
- [ ] Configurar HTTPS, variables de entorno solo con publishable key, URL Configuration y SMTP propio.
- [ ] Documentar quién responde a reclamaciones por derechos y plazos internos de revisión.
- [ ] Preparar privacidad, términos de uso, canal de denuncias y método de borrar cuentas.
- [ ] Revisar la disponibilidad legal de «OVIO» antes de usar el nombre comercialmente.
- [ ] Habilitar monitoreo de errores y un procedimiento de copia/restauración probado.

Si una prueba de permisos falla, **no abras la beta** hasta resolverla.
