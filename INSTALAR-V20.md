# OVIO Beta v2.0 — Registro abierto con protección de accesos

Esta actualización parte de OVIO v1.9. **No elimina ninguna tabla ni desactiva el registro abierto**.
El despliegue no está hecho: hazlo en tu repositorio Vercel tras pasar los comandos locales.

## A. Actualizar código sin bloquear el acceso

1. Haz copia de seguridad de la base de datos Supabase y del repositorio GitHub.
2. Copia los archivos del ZIP al repositorio actual, **sin reemplazar `.git` ni `.env.local`**.
3. Deja `VITE_TURNSTILE_SITE_KEY` **sin configurar** por ahora. Si antes no tenías CAPTCHA en Supabase, mantenlo desactivado en esta fase.
4. Ejecuta:

   ```powershell
   npm ci
   npm test
   npm run check:deploy
   npm run check:beta
   npm run build
   ```

5. Si todos los comandos terminan bien, haz commit y sube a GitHub para actualizar **el mismo proyecto Vercel**.
6. Comprueba registro, login, recuperación, perfil, estudio, letras privadas y PWA sin CAPTCHA. En Supabase → Authentication → Sign In / Providers: **Allow new users to sign up ON; Confirm email ON; Anonymous sign-ins OFF**.
7. Comprueba el dominio de producción en Authentication → URL Configuration, y que las URLs de correo de confirmación/recuperación regresen allí.

## B. Auditar Supabase sin modificar datos

1. Ejecuta `sql/014_auditoria_beta_publica_SOLO_LECTURA.sql` desde Supabase → SQL Editor.
2. Si aparece `REVISAR`, analiza cada fila. Que exista una política no garantiza que su condición sea correcta: haz las pruebas reales de `PRUEBAS-V20.md`.
3. Solo si la auditoría muestra privilegios de escritura no deseados para roles administrativos, y tienes respaldo, puedes ejecutar `sql/014_restriccion_roles_ADMIN_OPCIONAL.sql` para revocar esas concesiones de INSERT/UPDATE/DELETE. **No ejecutarlo a ciegas si has personalizado roles o procedimientos.**
4. No ejecutes de nuevo las migraciones 001-013 si ya están aplicadas.

## C. Activar Turnstile DESPUÉS de desplegar el frontend

El código admite protección CAPTCHA en cuatro flujos: registro, login, recuperación desde login y recuperación solicitada desde el perfil. Si activas CAPTCHA en Supabase antes de añadir el widget a la web, **puedes bloquear el inicio de sesión y el restablecimiento de contraseña de todos tus usuarios**.

1. Crea un widget **Cloudflare Turnstile** para el nombre de host real de OVIO (`tudominio.vercel.app` o el dominio final). Puedes registrar `localhost` para pruebas locales si Cloudflare lo permite para tu widget. Evita depender de URLs efímeras de Preview.
2. Guarda **Site Key** (pública) y **Secret Key** (privada) por separado.
3. En Vercel → Project → Settings → Environment Variables, añade `VITE_TURNSTILE_SITE_KEY` con tu **Site Key** pública como tipo **Config**, solo en los entornos/hosts donde hayas autorizado el widget. No añadas la Secret Key a Vercel ni la prefijes con `VITE_`.
4. Haz **Redeploy** de producción. Abre OVIO en ventana privada: el widget debe aparecer en inicio de sesión, registro y recuperar contraseña; y si estás conectado, en seguridad del perfil. Comprueba que el botón se activa al obtener un token. La primera prueba puede hacerse mientras el CAPTCHA de Supabase sigue desactivado.
5. Después, en Supabase Dashboard → Authentication → Bot and Abuse Protection → Enable CAPTCHA protection, elige **Cloudflare Turnstile** e introduce allí, **solo allí**, la **Secret Key** privada. Guarda.
6. Prueba inmediatamente desde otro navegador o sesión privada: (a) registro con correo nuevo, (b) inicio de sesión con cuenta antigua, (c) recuperación de contraseña, (d) recuperación desde perfil. La comprobación la hace **Supabase**, no JavaScript local.
7. Si algo se rompe, **desactiva la protección CAPTCHA en Supabase de inmediato**; así recuperarás el flujo anterior mientras resuelves el widget. No desactives la confirmación por correo.

Fuentes técnicas:
- Supabase: https://supabase.com/docs/guides/auth/auth-captcha
- Cloudflare: https://developers.cloudflare.com/turnstile/get-started/

## D. Medidas operativas antes de ampliar la beta abierta

- Configure SMTP de producción con límites apropiados. El correo predeterminado de Supabase está limitado y no es apropiado para envíos públicos voluminosos.
- Revisa los **Auth Rate Limits** de Supabase y realiza pruebas normales, sin intentar ataques de fuerza bruta.
- Deja la confirmación de email activa; no habilites accesos anónimos.
- No publiques claves `service_role`, secretos SMTP ni secret keys de Turnstile en el navegador o GitHub.
- Verifica que `song-audio` y `song-evidence` sean buckets PRIVADOS.
- Prueba RLS con **dos cuentas distintas**, no solo con la cuenta administradora.
- Confirma que la protección de despliegue de Vercel no impida entrar a la web pública de producción. Puedes mantener Preview protegido por separado.
- Completa políticas de privacidad, condiciones de uso, denuncias de derechos musicales y revisión del nombre OVIO antes de ampliar el público.

**Estado del paquete:** pruebas unitarias y revisión sintáctica realizadas. **No se ha ejecutado `npm run build` ni se ha probado Supabase en vivo desde este entorno.**
