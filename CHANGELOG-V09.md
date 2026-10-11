# v0.9.0 — 11/10/2026

- Añadido `src/mixes.js`: selección personalizada, radar emergente y recomendaciones de álbumes solo para canciones aprobadas.
- Nuevo componente UI de mixes musicales en Inicio y Descubrir, con opción para reproducir su cola.
- Guardar un mix como playlist privada editable y estable, con limpieza si falla la inserción.
- Tabla `saved_releases` con RLS (SQL 008) y opción de guardar/quitar álbumes y EPs.
- Biblioteca de álbumes guardados y álbumes sugeridos en Inicio.
- Nuevo `tests/mixes.test.js` con pruebas de seguridad de catálogo, filtros, límites y personalización.
- Se mantiene la infraestructura React + Supabase y no se activa ninguna monetización.
