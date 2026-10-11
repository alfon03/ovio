# Instalación de OVIO v1.7 — Navegación y responsividad

Esta actualización parte de **OVIO v1.6 ya funcionando** en Vercel y Supabase.

## 1. Copia de seguridad

Conserva una copia local de tu proyecto v1.6 y anota el último despliegue que funciona en Vercel para poder revertirlo.

**No borres tu carpeta `.git` ni tu `.env.local`**. El ZIP v1.7 no contiene estas entradas deliberadamente.

## 2. Copia los archivos

Desde el ZIP, incorpora a tu proyecto de GitHub estos archivos nuevos o actualizados:

- `src/NavigationSidebar.jsx` **nuevo**
- `src/sidebar-navigation.js` **nuevo**
- `src/App.jsx` **actualizado**
- `src/style.css` **actualizado**
- `tests/sidebar-navigation.test.js` **nuevo**
- `package.json` y `package-lock.json` **actualizados**
- `index.html` y `public/sw.js` **actualizados** (viewport/versión caché PWA)

El resto del ZIP es un proyecto fuente completo para consulta, pero si tienes modificaciones propias compáralas antes de sobrescribir archivos. No subas `node_modules`, `dist` o `.env.local` a GitHub.

## 3. Base de datos y entorno

**No hay migración SQL v1.7.** Mantén el Supabase existente y tus variables de Vercel.

En tu carpeta OVIO, desde PowerShell:

```powershell
npm ci
npm test
npm run check:deploy
npm run build
```

Para `check:deploy`, conserva en `.env.local` las variables públicas que ya utilizabas. Si `npm run build` falla, **no subas todavía** esta versión: comparte las primeras líneas del error para corregirlo.

## 4. Publicar

Si el build finaliza correctamente, actualiza el repositorio de GitHub que ya está vinculado a Vercel:

```powershell
git status
git add src/NavigationSidebar.jsx src/sidebar-navigation.js src/App.jsx src/style.css tests/sidebar-navigation.test.js package.json package-lock.json index.html public/sw.js README.md INSTALAR-V17.md PRUEBAS-V17.md CHANGELOG-V17.md
git commit -m "OVIO v1.7 navegación y responsive"
git push
```

El commit solo se puede realizar si ejecutas los comandos desde tu repositorio Git existente. Espera el estado **Ready** en Vercel y recarga la web; si utilizas PWA instalada, ciérrala y vuelve a abrirla para recibir la versión más reciente.

## 5. Revisar con cuentas reales

Comprueba las pruebas de `PRUEBAS-V17.md` en móvil, tableta y ordenador. Verifica los menús con cuentas normales y administradores. La visibilidad del enlace de administración no es una autorización: los permisos reales siguen aplicándose en Supabase.
