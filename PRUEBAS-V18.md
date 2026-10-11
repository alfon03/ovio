# OVIO v1.8 — Pruebas manuales recomendadas

1. **Explorar**: abre Descubrir con canciones aprobadas. Comprueba cabecera, últimos lanzamientos, géneros, recomendaciones, joyas ocultas (si hay datos agregados de seguidores), y acceso al catálogo.
2. **Géneros**: pulsa una tarjeta; el filtro debe cambiar y hacer scroll hasta el catálogo. «Todos» debe restaurar el catálogo completo.
3. **Buscar**: verifica que conserva búsqueda por texto, filtro por género, resultados de álbumes y artistas. Prueba limpiar filtros al no encontrar canciones.
4. **Estrenos**: las canciones pendientes o rechazadas no deben aparecer. Prueba una cuenta de artista diferente.
5. **Colas**: reproduce una canción desde «Recién estrenadas» y pasa a la siguiente; debe continuar dentro de esa selección. Repite con «Joyas ocultas», recomendadas y catálogo filtrado.
6. **Reproductor**: comprueba anterior, siguiente, aleatorio, repetir, volumen, posición y abrir reproductor completo. No deben desaparecer las canciones guardadas o playlists.
7. **Pérdida de red**: abre herramientas de red o desactiva internet después de iniciar una canción; cuando el navegador informe desconexión debe aparecer un aviso. Al restablecer la conexión, prueba el botón «Reintentar» si la reproducción falló. No debe reintentar en bucle ni publicar datos adicionales.
8. **PWA/móvil**: abre la PWA instalada, comprueba cabecera y tarjetas sin desbordamiento, reproductor sobre la navegación inferior y control del audio con pantalla bloqueada si el dispositivo lo soporta.
9. **Catálogo vacío**: con una cuenta de prueba y sin canciones aprobadas, no se deben mostrar títulos ficticios, ni errores de React.
10. **Regresión**: entra en Creadores, letras privadas, estadísticas, Moderación (admin), ayuda y playlists. Nada de estas funciones debe cambiar.

## Pasos antes de publicar

```powershell
npm test
npm run check:deploy
npm run build
```

En Vercel, el despliegue debe terminar en **Ready**. Las pruebas automáticas no sustituyen la prueba real de reproducción, Supabase, RLS ni navegador.
