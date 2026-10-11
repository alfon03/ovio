# OVIO Beta v2.0 — Registro abierto controlado

- Registro abierto conservado, con confirmación de correo ya existente.
- CAPTCHA Turnstile opcional y listo en registro, inicio de sesión, recuperación y perfil; requiere configuración en Cloudflare, Vercel y Supabase, en ese orden.
- Cabeceras HTTP anti-clickjacking y para interpretación segura del contenido.
- Comando `npm run check:beta` de comprobación estática sin secretos.
- Auditoría SQL 014 de SOLO LECTURA para RLS, roles, almacenamiento y unicidad.
- Script OPCIONAL para revocar escritura a roles administrativos desde la API.
- Plan de pruebas con cuentas de oyente, artista y moderador.
- No se modifican los datos de canciones, playlists, letras ni se crea una nueva base de datos.

### Importante
La configuración de Turnstile no se activa automáticamente al desplegar el código. Primero añade la Site Key a Vercel y verifica el widget; después habilita CAPTCHA en Supabase. No se ha verificado la base de datos del usuario ni compilado Vite en el entorno de generación.
