# OVIO Beta v1.2 — Permisos y seguridad previa a beta privada

Esta versión **no modifica la interfaz visual** ni añade funciones de streaming. Su objetivo es reforzar la seguridad de la versión v1.1 que ya funciona con tu Supabase. No exige nuevas dependencias. Incluye una migración SQL opcional de endurecimiento y una consulta de auditoría SOLO LECTURA.

## Orden de instalación (importante)

1. Confirma que 001–009 están aplicadas y la v1.1 funciona. **Haz una copia de seguridad** del proyecto y una exportación/copia recuperable de la base de datos y objetos importantes (comprueba el mecanismo de backup en tu plan Supabase).
2. Lee `sql/010_refuerzo_permisos.sql` y comprueba que no has modificado la estructura de perfiles, artistas ni canciones respecto al proyecto entregado. Si añadiste funcionalidades propias que actualizan columnas distintas, **NO ejecutes la migración sin adaptarla**.
3. En tu proyecto de OVIO, Supabase Dashboard → SQL Editor, ejecuta exclusivamente `sql/010_refuerzo_permisos.sql`. Las instrucciones están dentro de `BEGIN/COMMIT`; si aparece cualquier error, no continúes sin revisar.
4. Ejecuta `sql/AUDITORIA_SOLO_LECTURA.sql`. Todos los controles deben aparecer como `OK`. Si alguno da `REVISAR`, comprueba los nombres exactos de políticas y los permisos en tu proyecto.
5. Ejecuta las pruebas funcionales en `PRUEBAS-V12.md` usando **tres cuentas separadas**: oyente A, artista B y administrador C. Prueba también una ventana incógnito sin sesión.
6. Comprueba que la v1.1 mantiene la recuperación de contraseña, el registro y el reproductor. No necesitas reemplazar `App.jsx`, `.env`, ni volver a ejecutar 001–009.

## Qué cambia

- Se impide que el cliente modifique `created_at` o `id` de los perfiles.
- Solo puede insertar una solicitud de artista con datos de solicitud; aprobarla/rechazarla sigue siendo una operación administrativa controlada por RLS.
- Solo puede insertar una canción con datos de subida; actualizar estado/notas sigue siendo una operación administrativa controlada por RLS; editar metadatos de pendientes continúa vía `update_my_pending_track`.
- Favoritos, seguimientos y playlists solo aceptan canciones/artistas que ya están aprobados.
- Se reafirma `public=false` para los buckets privados `song-audio` y `song-evidence`.

## Limitaciones que todavía requieren comprobación humana

- Las pruebas unitarias y la auditoría SQL **NO garantizan** ausencia de vulnerabilidades. No hemos conectado ni probado tu instancia real.
- **Los emails verificados no prueban la identidad civil** del usuario ni los derechos musicales.
- Las portadas y avatares son públicos por diseño; los ficheros de pruebas de derechos NO deben hacerse públicos.
- Tus políticas de Supabase y el acceso a Storage deben probarse con credenciales reales de distintos usuarios, NO mediante SQL Editor como administrador (que puede saltarse RLS).
- El registro de reproducciones está sujeto a abuso; los rankings deben tratarse como beta, no para pagos.
- No se ha realizado una auditoría independiente de privacidad, licencias musicales, registro de marca OVIO, ni cumplimiento normativo.
- Una web publicada con registro abierto no es verdaderamente una beta «solo por invitación». Para una beta cerrada, configura un proceso de invitaciones real y valida los permisos antes de abrirlo.

## Qué NO hacer

- No publiques `SUPABASE_SERVICE_ROLE_KEY`, secretos SMTP ni claves `secret` dentro de `src/`, del ZIP público ni de las variables `VITE_*`.
- No marques públicos los buckets de audio o evidencia para «arreglar» un problema del reproductor. Utiliza políticas RLS y URLs firmadas de duración limitada.
- No copies la URL de restablecimiento de contraseña, tokens JWT ni datos de otros usuarios en tickets o capturas de soporte.

**Tras superar estas pruebas:** preparar hosting HTTPS, dominio, correo SMTP, páginas legales y acceso controlado a la beta.
