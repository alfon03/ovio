# OVIO · Comprobación del primer flujo real (v0.2)

> Ejecuta estas pruebas únicamente con archivos musicales de los que tengas todos los derechos. No compartas claves privadas ni UUID de usuarios públicamente.

## 1. Administrador (cuenta A)

1. Regístrate en la app, confirma el correo si Supabase lo requiere e inicia sesión.
2. En Supabase Dashboard → **Authentication → Users**, copia el **User UID** de TU cuenta.
3. En SQL Editor, sustituye `TU-UUID-AQUI` por el UID copiado y ejecuta:

```sql
insert into public.admin_users (user_id)
values ('TU-UUID-AQUI')
on conflict (user_id) do nothing;
```

4. Cierra sesión y vuelve a iniciar. Debe aparecer **Moderación** en el menú de la izquierda.

**No incluyas una clave `service_role` en React ni en variables `VITE_*`.**

## 2. Artista (cuenta B)

1. Abre una ventana de incógnito u otro navegador.
2. Crea una cuenta distinta y confirma el correo si se solicita.
3. Entra en **OVIO Studio** → **Solicitar perfil de artista** y completa los campos.
4. La pantalla debe indicar que la solicitud está **pendiente**. Todavía no debe poder subir música.

## 3. Aprobar la solicitud

1. Vuelve a la sesión de administrador (cuenta A), recarga y entra en **Moderación**.
2. Comprueba que está la solicitud de la cuenta B.
3. Pulsa **Aprobar**, revisa la confirmación y apruébala.
4. Actualiza OVIO Studio en la cuenta B: debe permitir **Crear álbum / EP** y **Subir canción**.

## 4. Probar una subida

1. Desde la cuenta B crea un álbum o sube directamente un single.
2. Sube un MP3/WAV creado por ti, con un título claro (hasta 30 MB) y adjunta documentación propia si quieres probar la evidencia (hasta 10 MB).
3. Marca la declaración de derechos y envíalo.
4. En el estudio de B debe aparecer con estado **Pendiente**.
5. Desde otra cuenta oyente, comprueba que la canción **NO aparece** en la búsqueda ni se puede reproducir antes de aprobarla.

## 5. Aprobar o rechazar una canción

1. En A → **Moderación**, reproduce el archivo pendiente y revisa los documentos adjuntos si los hay.
2. Pulsa **Aprobar** → confirma. La canción debe aparecer en la búsqueda de la cuenta B y otra cuenta oyente.
3. Para probar los rechazos, utiliza una **segunda canción de prueba**: pulsa **Rechazar**, escribe un motivo de al menos 10 caracteres y confirma.
4. En el estudio del artista debe mostrarse el rechazo y el motivo. La canción rechazada no debe aparecer para los oyentes.
5. Repite con 5 canciones activas: al intentar crear una sexta, la base de datos debe impedirlo (una canción rechazada no cuenta para ese límite).

## 6. Probar biblioteca y playlists

1. Desde la cuenta oyente, reproduce la canción aprobada.
2. Haz clic en Favoritos y crea dos playlists: una **privada** y una **pública**.
3. Añade la canción a las dos.
4. Comparte el enlace de la pública con un usuario autenticado diferente: debe poder verla.
5. La privada no debe verse desde otra cuenta.

## 7. Problemas frecuentes

- **No veo Moderación:** comprobar que se insertó el UID correcto; cerrar sesión y volver a entrar.
- **No llega el correo de confirmación:** comprobar Supabase → Authentication → Providers → Email y URL Configuration.
- **La subida falla:** revisar el tipo/tamaño del archivo, Storage → Buckets y la consola del navegador (F12).
- **No veo la canción aprobada:** actualizar la página y comprobar el estado en Table Editor → `tracks`.
- **Error RLS:** no desactivar RLS para resolverlo; documentar el mensaje y revisar la política específica.

## 8. Antes de invitar a usuarios externos

No abrir esta beta al público hasta probar también seguridad de subida, bloqueo y retirada de contenido, protección de datos, recuperación de contraseña y reglas legales sobre propiedad intelectual. Esta versión no cuenta con verificación automática de derechos ni un proceso de apelaciones completo.
