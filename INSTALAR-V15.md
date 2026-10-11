# OVIO v1.5 — Actualizar el piloto en tu Vercel y Supabase

## Antes de instalar

La actualización supone que ya tienes OVIO v1.4 en producción o en un entorno de pruebas, con la migración `011_feedback_beta.sql` aplicada. Conserva la base de datos existente. Haz una copia de seguridad de tus archivos y del proyecto Supabase antes de ejecutar SQL.

## 1. Base de datos

En **Supabase → SQL Editor** revisa y ejecuta exclusivamente `sql/012_panel_piloto.sql`.

No vuelvas a ejecutar migraciones 001–011 ni borres ninguna tabla.

Después ejecuta `sql/012_verificacion_solo_lectura.sql`, que debería mostrar `true` para los tres indicadores. Esta consulta solo comprueba configuración, no datos.

**Seguridad real**: abre OVIO con una cuenta que NO sea administradora; si intenta invocar `get_ovio_pilot_overview()` desde una petición API, debe recibir `42501`/`Solo el equipo administrador...`. Que la función se pueda invocar como rol `authenticated` no es un fallo: la verificación `is_admin()` está dentro de la función.

## 2. Código React

Si has modificado tu proyecto, compara los cambios; no sobrescribas personalizaciones sin revisar. La actualización añade estos archivos:

- `src/BetaPilot.jsx`
- `src/beta-pilot.js`
- `tests/beta-pilot.test.js`

Y modifica:

- `src/App.jsx` (navegación y pantalla de inicio)
- `src/style.css` (estilos responsive)
- `package.json` (versión 1.5.0, mismas dependencias)

El archivo `.env` y las variables de Supabase en Vercel **no cambian**. **No añadas claves secretas**.

## 3. Pruebas y despliegue

```bash
npm install
npm test
npm run build
```

Si la compilación y pruebas pasan, sube los archivos a **tu mismo proyecto Vercel**. Verifica el despliegue y luego prueba:

1. Inicia sesión con un **oyente**. Entra en **Primeros pasos** desde el menú. Debe aparecer el progreso de su propia cuenta. Desde cada paso puedes navegar a perfil, descubrimiento o biblioteca.
2. Crea una playlist y guarda una canción; vuelve al recorrido. Deben marcarse los pasos correspondientes.
3. Inicia sesión con el **administrador**. En el menú aparecerá **Panel del piloto**. Comprueba que carga las cifras.
4. Abre **Moderación** y **Comentarios beta** desde el panel; comprueba que los enlaces funcionan.
5. Comprueba que no aparecen identificadores, emails o reproducciones individuales en las métricas del piloto.
6. Intenta consultar la RPC desde una cuenta no administradora para asegurar la protección de servidor.
7. Prueba reproducción, recuperación de contraseña, perfil, playlists, subir canción y revisión después de desplegar.

## 4. Política de acceso

Esta versión **no** limita quién puede registrarse. Para una beta solo por invitación, deja `Allow new users to sign up` desactivado en **Supabase Auth** y comprueba el flujo de invitación desde una cuenta externa. Si la página de Vercel está protegida por su propio control, tus participantes necesitarán un mecanismo autorizado para acceder. No publiques datos reales ni abras registros hasta revisar licencias musicales, privacidad, términos y la viabilidad de la marca OVIO.

## Límites de las métricas

- `Cuentas registradas` cuenta filas de perfil, no usuarios activos ni correos confirmados.
- `Sesiones de al menos 30 s` utiliza sesiones registradas, no audiencias verificadas de forma infalible.
- Minutos y oyentes de 7 días requieren que el usuario haya habilitado el seguimiento. No representan todas las escuchas.
- El panel no sustituye una auditoría de seguridad ni demuestra que OVIO esté legalmente lista para abrir.
