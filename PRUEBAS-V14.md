# OVIO v1.4 — Checklist de aceptación del piloto

## Derechos y acceso
- [ ] Un usuario nuevo no entra si la beta está configurada solo por invitación.
- [ ] Un usuario con sesión solo puede leer sus propios comentarios.
- [ ] Un oyente no puede modificar status ni response mediante llamada directa a Supabase.
- [ ] Un administrador puede leer y responder los comentarios de todas las cuentas.
- [ ] El audio no aprobado sigue siendo privado y no aparece en Buscar, mixes ni playlists públicas.

## Funcionalidad
- [ ] Crear comentario tipo Error y verlo como Nuevo.
- [ ] Responder desde el administrador y visualizar la respuesta en la cuenta de origen.
- [ ] Filtrar incidencias por estado.
- [ ] Rechazar sexto envío en una hora por cuenta.
- [ ] Conservar nombres únicos, recuperación de acceso y verificación de correo.
- [ ] Reproducir música, cambiar de canción, playlist pública/privada, álbum, single.
- [ ] Subir pista: sigue pendiente de revisión; probar aprobación y rechazo desde admin.

## Operación y lanzamiento
- [ ] SMTP configurado para invitaciones/recuperación en producción.
- [ ] Contacto de soporte y buzón operativo.
- [ ] Revisión legal: originalidad de la música, cláusulas de licencia, propiedad intelectual, privacidad, consentimiento de analíticas y política de denuncias.
- [ ] Resolver riesgo de marca OVIO antes de hacer marketing.
- [ ] Disponer de un proceso manual de retirada inmediata de una pista.
- [ ] Monitorizar errores del navegador y presupuesto de tráfico/storage.
- [ ] Evaluar resultados tras dos semanas con un grupo pequeño de invitados.

## Éxito inicial sugerido (metas internas, no previsiones)
- 5–10 artistas y 10–20 oyentes en el piloto.
- Registrar fallos y resolver cualquier fallo que impida reproducir o publicar antes de ampliar el grupo.
- Medir si los oyentes vuelven y descubren canciones nuevas (con métricas voluntarias y respetando privacidad).
- Medir tiempo de revisión de canciones y coste de alojamiento.
