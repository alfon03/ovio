# OVIO — Beta v1.6

OVIO es una plataforma de descubrimiento musical para artistas independientes, creada con **React + Vite + Supabase** y preparada para desplegarse en **Vercel**.

## Novedades

- Solucionado el error de Vite de `BetaSupport.jsx` en la v1.5.
- **Creadores → Mis letras privadas**: editor de borradores para artistas aprobados, almacenados en Supabase con RLS por propietario, sin publicación pública.
- **PWA instalable** y favicon/iconos para navegadores, Android e iOS, usando la marca OVIO existente.
- Mantiene reproducción, playlists, perfiles, moderación, recuperación de cuentas, soporte de la beta y panel del piloto.

## Instalación y actualización

1. Lee **[`INSTALAR-V16.md`](./INSTALAR-V16.md)** antes de cambiar los archivos.
2. Ejecuta en tu Supabase EXISTENTE `sql/013_lyrics_private.sql` tras las migraciones anteriores.
3. Mantén `.env.local` solo en tu PC (consulta `.env.example`); en Vercel usa las variables Config del proyecto.
4. Ejecuta `npm ci`, `npm test`, `npm run check:deploy`, `npm run build` y despliega si terminan correctamente.
5. Comprueba privacidad real con **dos cuentas distintas** siguiendo `PRUEBAS-V16.md`.

No se incluyen `node_modules`, el historial Git, archivos generados `dist`, ni archivos `.env.local` con datos de conexión. No se introducen pagos, publicidad ni publicación automática de letras. La edición de letras y reproducción requieren conexión; el service worker no guarda datos privados.

**Nota:** no se pudo ejecutar un build Vite completo en el entorno de preparación por falta de acceso a npm. La prueba definitiva de compilación se realiza en tu ordenador o en Vercel.
