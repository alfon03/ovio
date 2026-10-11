# Cambios v0.7 — 11 de octubre de 2026

- Panel privado de estadísticas, accesible solo para artistas aprobados.
- Nuevos agregados: reproducciones válidas, minutos de escucha, oyentes únicos, seguidores actuales, seguidores actuales incorporados en los últimos 30 días.
- Tendencias mensuales para períodos de 1, 3, 6 y 12 meses.
- Comparación por canción publicada.
- Migración incremental `sql/006_artist_insights.sql`: función RPC privada con verificación del usuario conectado y sin datos personales de oyentes.
- Los datos no se simulan, proceden de la v0.6 y requieren consentimiento del oyente.

**Validación:** las pruebas unitarias de datos y de las versiones anteriores se ejecutaron correctamente. `App.jsx` y `ArtistInsights.jsx` se analizaron sintácticamente con TypeScript. La compilación Vite completa no se ejecutó (no están disponibles los paquetes npm sin conexión). La migración no se ejecutó contra Supabase real.
