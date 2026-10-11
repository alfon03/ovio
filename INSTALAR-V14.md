# OVIO v1.4 — Beta de prueba con comentarios y soporte

## Qué aporta
- Sección **Ayuda y sugerencias** desde la navegación principal.
- Registro de incidencias, problemas de uso, ideas y consultas.
- Historial privado y respuestas visibles solo para la persona que envió el comentario.
- **Comentarios beta** exclusivo para administradores; cambiar estados y responder.
- Un máximo de 5 comentarios por usuario/hora validado en PostgreSQL.
- Protección RLS, sin exponer claves privadas de Supabase.

## Instalación sobre OVIO v1.3 (sin borrar datos)
1. Haz copia de seguridad del código y de los datos antes de aplicar cambios.
2. En el Supabase que YA utilizas, abre SQL Editor y ejecuta **solo** `sql/011_feedback_beta.sql`.
3. Copia `src/App.jsx` y `src/style.css` de v1.4 a tu proyecto. Añade `src/BetaSupport.jsx` y `src/beta-feedback.js`.
4. No sustituyas tu `.env` ni cambies las claves o URL de Supabase. No vuelvas a ejecutar las migraciones 001–010.
5. Actualiza el `package.json` a v1.4 solo si quieres sincronizar la etiqueta de versión (las dependencias son las mismas).
6. En local: `npm test`, `npm run build`, `npm run dev`.
7. Despliega el código a **tu mismo proyecto Vercel**, sin crear otro Supabase; los valores VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY siguen iguales. Cuando termine el deployment comprueba la sección «Ayuda y sugerencias».

## Prueba mínima con 2 cuentas
- Cuenta de oyente: entra en **Ayuda y sugerencias**, rellena los campos y envía. Debe verse en **Mis comentarios** con estado Nuevo.
- Cuenta admin: entra en **Comentarios beta**, abre la incidencia y cámbiala a **En revisión**; añade una respuesta.
- Cuenta de oyente: refresca y comprueba que ve la respuesta. **No** debe ver los comentarios de otra cuenta.
- Cuenta de oyente: comprueba que no existe botón administrativo ni puede alterar estados mediante la API; debes probar también una petición HTTP manual para validar RLS.
- Enviar seis incidencias con la misma cuenta dentro de una hora: la sexta debe ser rechazada desde PostgreSQL.
- Prueba además reproducción, álbumes, playlists, subir canciones y moderación para descartar regresiones.

## Cómo invitar testers sin abrir OVIO a todo el mundo
La interfaz de OVIO conserva el botón Registrarse, pero **eso por sí mismo no limita el acceso**. Para una beta cerrada:
1. En Supabase → Authentication → Sign In / Providers desactiva **Allow new users to sign up**. Solo deben entrar cuentas existentes o invitadas; comprueba el comportamiento en tu proyecto.
2. Supabase → Authentication → Users → Add user → **Send invitation**. Envia invitaciones únicamente a las personas seleccionadas.
3. Verifica que la plantilla de invitación y Site URL llevan a la URL HTTPS actual de OVIO. La persona invitada puede necesitar configurar su contraseña mediante la recuperación de acceso disponible en OVIO.
4. **Si Vercel tiene Deployment Protection activo**, los invitados pueden quedar bloqueados antes de llegar a OVIO. Valida el acceso desde un navegador externo antes de repartir enlaces; decide una configuración adecuada para testers. No creas que un enlace no indexado es protección.
5. Antes de abrir registros públicamente, vuelve a habilitar los registros solo cuando hayas revisado derechos, textos legales, privacidad, marca y soporte.

## Advertencias de seguridad y privacidad
- En soporte NO se deben pedir contraseñas, DNI ni capturas con datos sensibles. No adjuntamos archivos en esta versión.
- Denuncias de propiedad intelectual van al botón específico de canciones, no a Ayuda y sugerencias.
- Un índice de UNIQUE o una política RLS no sustituye una auditoría externa completa.
- Las respuestas del administrador son visibles al autor del comentario; no escribas notas internas confidenciales.
- Es necesario configurar plazo de conservación y política de privacidad antes de invitar a usuarios externos.
- OVIO continúa como marca provisional; conviene resolver los posibles conflictos de marca antes del lanzamiento público.
- Vercel y Supabase tienen cuotas y condiciones diferentes según el plan.

## Revisión técnica del entregable
- Tests automáticos locales: `npm test`.
- JSX: parseado con TypeScript, sin errores sintácticos.
- No se ha ejecutado la migración ni probado correos/despliegue contra tu Supabase particular desde este entorno; hay que realizar las pruebas del apartado anterior.
