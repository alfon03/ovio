# OVIO v1.8 — Instalación sin perder tus datos

Esta actualización parte de **OVIO v1.7 funcionando en GitHub, Vercel y Supabase**. No modifica tablas, permisos, buckets ni políticas RLS: **no necesita SQL nuevo**.

## 1. Guarda una copia

Antes de copiar nada, conserva tu carpeta local de OVIO y anota el último deployment que marca «Ready» en Vercel. **No elimines** las carpetas `.git`, tu `.env.local`, ni los ajustes de Supabase. El ZIP no incluye datos privados, dependencias ni artefactos compilados.

## 2. Actualiza estos archivos

Copia desde este ZIP al repositorio existente:

- `src/App.jsx` — pantalla Explorar, estados de audio y controles multimedia.
- `src/style.css` — tarjetas, cabecera y estados adaptados a móviles.
- `src/explore-collections.js` **nuevo** — orden y filtros de colecciones públicas.
- `src/playback-recovery.js` **nuevo** — mensajes de error y reglas de reintento.
- `tests/explore-collections.test.js` **nuevo**.
- `tests/playback-recovery.test.js` **nuevo**.
- `public/sw.js` — renueva la versión de la caché estática de la PWA.
- `package.json` y `package-lock.json` — versión del proyecto.
- `README.md`, `CHANGELOG-V18.md` y `PRUEBAS-V18.md` — documentación.

**No sobrescribas cambios propios que hayas realizado desde v1.7** sin compararlos primero.

## 3. Prueba en PowerShell

En la carpeta del proyecto existente:

```powershell
npm ci
npm test
npm run check:deploy
npm run build
```

`check:deploy` necesita tus variables VITE de Supabase en `.env.local` o el entorno. Nunca publiques tu archivo `.env.local` ni una clave `service_role`/`sb_secret_`. Si tu app ya utiliza las variables de Vercel, no necesitas cambiarlas.

Si `npm run build` da error, **no subas los cambios** y comparte el primer bloque de error. La comprobación local `check:deploy` no valida Supabase en vivo.

## 4. Sube a GitHub y Vercel

```powershell
git status
git add src/App.jsx src/style.css src/explore-collections.js src/playback-recovery.js tests/explore-collections.test.js tests/playback-recovery.test.js public/sw.js package.json package-lock.json README.md CHANGELOG-V18.md INSTALAR-V18.md PRUEBAS-V18.md
git commit -m "OVIO v1.8 explorar y reproductor"
git push
```

Espera a que Vercel indique **Ready**. Abre la web online y vuelve a iniciar la PWA instalada, si procede, para que recoja la nueva caché. Si el despliegue falla, vuelve al último deployment correcto de Vercel.

## 5. Comprueba las funciones

Consulta [PRUEBAS-V18.md](./PRUEBAS-V18.md). Hazlo con una cuenta normal y, si puedes, también con una cuenta de artista.

**Nota:** los controles multimedia del sistema dependen de que el navegador admita Media Session. La app sigue funcionando si no los admite. Las canciones no se descargan ni están disponibles offline. El aviso «Sin conexión» detecta la conectividad informada por el navegador, no garantiza el estado del servidor de audio.
