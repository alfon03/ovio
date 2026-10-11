# OVIO v1.7 — Menús desplegables y diseño adaptativo

## Navegación
- Se sustituyó el antiguo menú plano de `src/App.jsx` por un componente independiente `src/NavigationSidebar.jsx`.
- El menú **Explorar** se despliega inicialmente, mientras que **Creadores** y **Moderación** se abren al pulsarlos o cuando se navega a una pantalla de esas secciones.
- El menú **Moderación** solamente se representa para administradores. Esto no sustituye la autorización RLS de Supabase.
- Los accesos a borradores de letras y estadísticas de artista se muestran solo al artista aprobado.
- Mejoras de accesibilidad: encabezados interactivos, `aria-expanded`, `aria-controls`, `aria-current`, títulos descriptivos, `Escape`, foco y enlace para saltar al contenido.

## Responsividad
- El menú se convierte en panel lateral en tabletas y móviles (ancho hasta 980 px).
- Fondo de cierre, bloqueo de desplazamiento del documento durante el panel, cierre táctil y mediante teclado.
- Scroll vertical interno para que menús largos sigan disponibles.
- Ajustes para tablas y formularios, tarjetas, reproducción móvil, áreas seguras de dispositivos y texto largo.
- La PWA mantiene iconos existentes; versión de caché estática actualizada a v17.

## Infraestructura
- Sin cambios de Supabase, RLS, esquema SQL, URL de autenticación ni variables de entorno.
- Versión del proyecto y `package-lock.json` actualizadas a 1.7.0.
- Cuatro pruebas de navegación nuevas.

## Validación
- 71 pruebas automáticas superadas.
- Sintaxis de todos los archivos `src/*.js` y `src/*.jsx` verificada con parser TypeScript.
- Build Vite completo no ejecutado: DNS de registry.npmjs.org no disponible aquí.
