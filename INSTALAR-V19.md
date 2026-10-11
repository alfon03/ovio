# Instalar OVIO Beta v1.9

**Versión base:** OVIO v1.8 que ya tienes en Vercel, GitHub y Supabase. **SQL adicional:** ninguno.

1. Guarda una copia de la carpeta actual y anota el commit de GitHub que funciona en Vercel (para poder volver atrás).
2. Descarga el nuevo ZIP y copia sus archivos dentro de tu repositorio existente, conservando **`.git`** y tu **`.env.local`**. No subas `.env.local` a GitHub.
3. Desde PowerShell en la carpeta OVIO:

```powershell
npm ci
npm test
npm run check:deploy
npm run build
```

Si la compilación acaba con un error, **no subas todavía** la versión; revisa el primer error de la terminal.

4. Sube a GitHub con tus pasos habituales y espera a que Vercel indique `Ready`. En los ajustes de Vercel se mantienen `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, de tipo público/Config; jamás uses claves secretas en `VITE_*`.
5. Haz las pruebas de `PRUEBAS-V19.md` con cuentas secundarias, especialmente el cambio de cuenta y el cierre de sesión desde otra pestaña.

**Recuperación:** si apareciera un error en producción, restaura/redeploy el último commit estable desde Vercel. No borres datos ni repitas las migraciones SQL.

**Privacidad:** la caché PWA se limita a archivos estáticos; ni letras ni audio son offline. Mantén RLS activado en Supabase.
