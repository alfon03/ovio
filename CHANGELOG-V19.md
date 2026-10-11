# OVIO Beta v1.9 — Estabilidad y rendimiento

## Correcciones aplicadas

- **Menos solicitudes a Supabase:** al registrar una escucha válida, se actualiza la lista local sin volver a cargar más de quince colecciones y RPCs. El servidor mantiene la validación y unicidad de escuchas.
- **Carga protegida contra carreras:** si el usuario cambia de cuenta o realiza varias acciones muy rápido, las respuestas antiguas ya no sobrescriben la información de la cuenta activa.
- **Sesiones más seguras:** si Supabase cierra la sesión desde otra pestaña, se detiene el reproductor, se borra su fuente, se limpia el estado y se restablecen preferencias sensibles del cliente.
- **Fallo de interfaz recuperable:** una excepción React inesperada muestra una pantalla con botón para recargar, en lugar de una pantalla vacía. No envía errores a terceros.
- **PWA actualizada:** nombre de caché `ovio-pwa-static-v19`; continúa sin guardar canciones, sesiones ni letras en caché.
- **Identificación del build:** cabecera «OVIO BETA · 1.9».
- **Sin migraciones SQL:** se conservan todas las funciones de Supabase y tablas de la v1.8.

## Límites deliberados

- No hay telemetría ni rastreo nuevo. El historial de escucha sigue sometido al esquema existente de privacidad y a la validación de Supabase.
- Los límites `.limit(1000)` ya presentes siguen vigentes: antes de escalar a un catálogo grande hay que implementar paginación por colección.
- Las comprobaciones automatizadas no equivalen a una auditoría de RLS, derechos musicales o pruebas completas con dispositivos reales.
