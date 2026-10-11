# OVIO Beta 1.6 · Reparación de build, letras privadas y PWA

## Qué se ha corregido

- Error de compilación en `src/BetaSupport.jsx`: `submit(e)` ya no declara otra variable `e` en el mismo ámbito.
- Nuevo apartado **Creadores → Mis letras privadas** y acceso desde OVIO Studio para artistas **aprobados**.
- Editor de letras: crear, guardar, editar, borrar y vincular opcionalmente a una canción propia. Los borradores no tienen acción de publicación y no aparecen en el catálogo público.
- Tabla `artist_lyric_drafts` con Row Level Security (RLS) de **propietario**; `anon` no obtiene permisos. Los administradores de la base de datos que tengan permisos privilegiados siguen pudiendo acceder a datos, como en cualquier base de datos gestionada.
- PWA: manifest, service worker de archivos públicos, iconos SVG/PNG/ICO (16, 32, 48, 180, 192 y 512 px) y variantes maskable. La aplicación requiere internet para datos privados y audio.

## 1. Copia de seguridad

Guarda una copia de tu proyecto y exporta una copia de seguridad de Supabase. La versión desplegada en Vercel sigue intacta hasta tu próximo despliegue.

## 2. Actualiza los archivos

Descomprime `OVIO-beta-v1.6-corregida.zip`. Contiene `OVIO/` con código fuente, SQL y los iconos. No incluye `.env.local`, `.git`, `dist` ni `node_modules`.

Si tienes cambios propios, COMPARA antes de sustituir los archivos. Como alternativa puedes usar el contenido de esta carpeta limpia para tu repositorio y **conservar tus variables de Vercel**.

En el ordenador, crea tu `.env.local` a partir de los valores que ya usabas (NO lo subas a GitHub). Asegúrate de que `.gitignore` lo excluya.

## 3. SQL en el Supabase existente

En Supabase → SQL Editor, ejecuta **únicamente** `sql/013_lyrics_private.sql`, una vez que tengas instaladas las migraciones anteriores. No ejecutes de nuevo `001` a `012`.

La migración crea una nueva tabla: **no elimina ni modifica canciones, artistas, álbumes ni playlists existentes**. Haz las pruebas primero en un proyecto de prueba si es posible.

```sql
-- Verificación de existencia y RLS (solo lectura):
select c.relname as tablename, c.relrowsecurity as rowsecurity,
       c.relforcerowsecurity as forcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'artist_lyric_drafts';

-- Verificación de políticas (solo lectura):
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'artist_lyric_drafts'
order by policyname;
```

La tabla debe tener `rowsecurity=true`, `forcerowsecurity=true` y políticas para SELECT/INSERT/UPDATE/DELETE con comprobación de `auth.uid()`.

## 4. Antes de subir a GitHub

En la terminal de la carpeta `OVIO`:

```powershell
npm ci
npm test
npm run check:deploy
npm run build
```

`check:deploy` depende de `.env.local` y no comprueba Supabase real. **No subas nada si `npm run build` falla.** Asegúrate también de que no se han incluido `.env.local`, `.env`, claves secretas ni la carpeta `node_modules` en el commit.

```powershell
git status --short
git check-ignore .env.local node_modules dist
```

El repositorio debe conservar el código fuente, `public`, `sql`, `package.json`, `package-lock.json` y `vercel.json`; Vercel instala las dependencias y genera `dist` por sí mismo.

## 5. Publicar en Vercel

Envía a GitHub solo después de confirmar que el build local termina bien. Vercel desplegará la versión que compila; conserva estas variables que ya tenías:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

No añadas claves `service_role` ni `sb_secret_` en variables `VITE_`.

Si antes Vercel fallaba, la corrección específica está en `src/BetaSupport.jsx`. Comprueba en Deployments que la nueva compilación aparece como **Ready**.

## 6. Prueba de privacidad de letras

1. Con **artista A aprobado**, crea y guarda una letra. Recarga y verifica que sigue allí.
2. Con **artista B aprobado**, entra en Mis letras: no debe aparecer la de A.
3. Con un **oyente sin aprobación**, comprueba que no puede crear borradores ni consultar los de A.
4. Comprueba que la letra no aparece en la búsqueda, las canciones públicas ni el panel de moderación.
5. Vuelve a la cuenta A, modifica la letra y comprueba que se guarda; prueba también el borrado.
6. En Supabase, revisa RLS; las pruebas de interfaz por sí solas NO bastan para garantizar privacidad.

## 7. Instalar PWA e iconos

Tras desplegar en HTTPS, abre OVIO en Chrome o Edge y busca **Instalar OVIO** en tu perfil o en el menú del navegador. En Android también puedes usar el menú del navegador. En iPhone/iPad usa Safari → Compartir → Añadir a pantalla de inicio. Los navegadores deciden cuándo mostrar la opción de instalación.

Prueba `https://TU-DOMINIO/manifest.webmanifest`, `https://TU-DOMINIO/icons/icon-512.png`, `https://TU-DOMINIO/apple-touch-icon.png` y `https://TU-DOMINIO/favicon.ico`. Si ves el icono anterior, cierra pestañas, actualiza con caché vacía o reinstala el acceso directo. No se han implementado descargas musicales ni edición offline de letras.

## 8. Incidencias y límites

- La verificación en este paquete incluye pruebas unitarias y validación de sintaxis JSX; **la compilación Vite no se pudo completar en el entorno de preparación** debido a la falta de acceso a npm. Verifica `npm ci` y `npm run build` en Windows antes de subirlo.
- El SQL aún debe aplicarse y probarse con tu proyecto de Supabase: no tenemos acceso directo a tu cuenta.
- Una PWA instalada no es lo mismo que una app publicada en App Store / Play Store.
