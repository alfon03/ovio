# OVIO Beta v1.3 — Publicación controlada en Vercel

Este paquete es una continuación de la v1.2. **No requiere ejecutar más SQL.** Conserva la misma base de Supabase y no añade funcionalidades públicas de pago.

## 0. Antes de empezar

- Confirma que la v1.2 sigue funcionando en local y que ejecutaste la auditoría y las pruebas de permisos con cuentas distintas.
- Guarda una copia del código y prepara un plan de copia/recuperación de los datos y objetos de Supabase.
- **Todavía NO invites públicamente a músicos.** Quedan pendientes los textos legales, la validación de derechos musicales, la comprobación registral del nombre OVIO y pruebas de seguridad externas.
- Aunque utilices el nombre OVIO para la beta interna, existe riesgo de conflicto de marca y debe verificarse antes del lanzamiento.

## 1. Elegir la forma de desplegar

**Opción sencilla: Vercel CLI** (no requiere GitHub):

```sh
npm install
npm test
npm run build
npm install -g vercel
vercel login
vercel
```

Desde la carpeta que contiene `package.json`, acepta la creación de un proyecto nuevo, framework Vite, *root directory* `./`, *build command* `npm run build` y carpeta de salida `dist`. El comando `vercel` crea inicialmente un despliegue de prueba (preview). Cuando tengas revisada la seguridad y desees publicar en producción, `vercel --prod`.

**Alternativa con GitHub:** crea un repositorio privado, sube este proyecto **sin** archivos `.env` y en Vercel → Add New → Project → Import Git Repository. Comprueba que la carpeta raíz del repositorio contiene `package.json`. 

## 2. Configurar variables de entorno en Vercel

Vercel → tu proyecto → Settings → Environment Variables. Añade estas dos claves tanto al entorno de Preview como al de Production si planeas desplegar en ambos:

```
VITE_SUPABASE_URL         = https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = TU_CLAVE_PUBLICA
```

Los valores los obtienes de tu proyecto Supabase en *Project Settings → API* o *Connect*. Puedes usar la clave publishable (`sb_publishable_...`) o la clave pública heredada `anon`. **Jamás añadas `sb_secret_...`, `service_role` ni claves privadas.** Las variables que empiezan por `VITE_` quedan visibles en el código JavaScript servido al navegador. La seguridad real depende de RLS, políticas de Storage y funciones bien configuradas.

Después de configurar o cambiar variables, **vuelve a desplegar** para que Vite las incorpore al build. 

Puedes ejecutar localmente `npm run check:deploy` para verificar el formato de las variables de tu `.env` sin imprimirlas. El script no conecta a Supabase y no sustituye pruebas reales.

## 3. Protección antes de enviar el enlace

Vercel → proyecto → Settings → Deployment Protection. Activa **Vercel Authentication en "All Deployments"** para que ni la URL de producción quede abierta a visitantes arbitrarios. Revisa la configuración, pues algunas opciones protegen solo los previews; **la URL de producción puede permanecer pública** por defecto.

Esta protección sirve para el equipo interno; invitados externos necesitarán que Vercel les conceda acceso o un mecanismo de enlace compartible adecuado. No es un sistema de invitaciones a OVIO ni protege directamente las APIs de Supabase. Si quieres una beta abierta a 20–50 invitados externos, habrá que implementar acceso por invitación y comprobar también el control de altas en Supabase.

`robots.txt` y `noindex` evitan solicitar indexación, pero NO protegen el contenido ni sustituyen la autenticación.

## 4. Actualizar direcciones en Supabase Auth

Cuando tengas la dirección EXACTA de Vercel (por ejemplo `https://ovio-pruebas.vercel.app`):

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: coloca esa dirección exacta (sin `/` final, para evitar confusiones).
3. **Redirect URLs**: añade `https://ovio-pruebas.vercel.app/**` y conserva `http://localhost:5173/**` para probar en local.
4. Usa URLs exactas por dominio cuando sea posible. Si tienes varios despliegues preview, configura los patrones adecuados, pero evita comodines muy amplios para dominios ajenos.
5. Comprueba que registro, confirmación de correo y recuperación de contraseñas redirigen a la URL correcta.
6. Para una beta con usuarios externos, configura SMTP propio y revisa políticas del remitente y límites de email.

**Atención:** si proteges Vercel con autenticación propia, los enlaces de confirmación y recuperación también pasarán por esa protección. Asegúrate de que los probadores tengan acceso a la web.

## 5. Lista mínima de verificación desde otro dispositivo

- La home responde con HTTPS; `favicon.svg`, estilos y JavaScript cargan sin 404.
- Abrir un enlace directo al perfil o playlist compartida no devuelve un 404 de servidor.
- Inicio de sesión, cierre, confirmación y recuperación se comportan como en local.
- Una cuenta oyente no puede acceder a moderación, editar datos ajenos ni leer pruebas de autoría.
- El artista puede subir una canción privada; el administrador puede aprobarla; otros usuarios solo pueden escucharla cuando esté aprobada.
- Las playlists privadas no son públicas. Las recomendaciones no muestran canciones pendientes.
- Reproductor funciona en móvil y sobremesa; probar Safari y Chrome al menos.
- Notificaciones, recomendaciones y estadísticas se comprueban con varias cuentas distintas.
- Correo SMTP, denuncias por copyright, condiciones de uso, privacidad y marca están revisados **antes de invitar a público real**.

## 6. Incidencias típicas

- **Pantalla de configuración**: faltan `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` en Vercel o no redeployaste.
- **Enlace de email vuelve a localhost**: Site URL/Redirect URLs de Supabase no están actualizadas.
- **Error 404 al abrir enlaces**: falta `vercel.json` en la raíz o no se incluyó en el despliegue.
- **No reproduce audio**: comprueba las políticas privadas de Storage y la generación de URLs firmadas. NO hagas público el bucket por comodidad.
- **No permite entrar**: revisa primero si Vercel Authentication está bloqueando al probador, y luego errores de Supabase Auth.
- **El dominio "OVIO" da conflicto**: no registres ni promociones el nombre hasta completar búsqueda jurídica de marca y dominio.

## 7. Comprobaciones ejecutadas en este paquete

`npm test` cubre la lógica local. La compilación real con Vite se debe comprobar con `npm run build` en un entorno con dependencias disponibles. **No se han probado datos reales ni despliegue en tu cuenta de Vercel**.
