# OVIO Beta v1.8 — Descubrimiento y reproductor

## Explorar

- Portada musical destacada con atajo al catálogo y a la última canción aprobada.
- «Recién estrenadas»: novedades aprobadas, priorizando artistas diferentes.
- «Encuentra tu sonido»: géneros reales, con cantidad de canciones y filtro interactivo.
- «Tu próximo descubrimiento»: conserva las recomendaciones existentes de OVIO.
- «Joyas ocultas»: canciones de artistas con hasta cinco seguidores **solo cuando se dispone de ese recuento**, sin fingir popularidad.
- «Lo nuevo de quienes sigues» y mixes personalizados, si existen datos.
- Búsqueda y filtro de catálogo conservados; se añaden estados vacíos más claros.

## Reproductor

- Estado de carga de audio y aviso al perder conexión.
- Mensajes para errores de red o formato, con reintento manual y nueva URL firmada si falla la fuente anterior.
- Compatibilidad opcional con Media Session para título, artista, portada, pausa, reproducción, siguiente, anterior y búsqueda cuando el navegador lo permita.
- Se conserva la cola, aleatorio, repetición, opt-in de analíticas y bookmarks.

## Despliegue

- Sin cambios SQL ni variables de entorno nuevas.
- Actualizada la versión de caché de la PWA, sin guardar canciones ni datos privados offline.
- Pruebas unitarias añadidas para colecciones y recuperación de audio.
