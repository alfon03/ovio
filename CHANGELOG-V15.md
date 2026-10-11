# OVIO v1.5 — Preparación del piloto privado

- Nueva pantalla **Primeros pasos** para que cada usuario complete el perfil, guarde una canción, cree una playlist y siga a un artista. La lista se calcula con los datos actuales de su cuenta.
- Nueva pantalla administrativa **Panel del piloto** con cuentas registradas, altas de la semana, solicitudes de artistas y canciones pendientes, mensajes de soporte y actividad de escucha agregada con consentimiento.
- Nueva función SQL `get_ovio_pilot_overview()` con comprobación **obligatoria en el servidor** de `is_admin()`. No permite a usuarios normales consultar estas cifras.
- Indicadores de actividad de los últimos 7 días: solo oyentes que activaron voluntariamente las estadísticas; no se interpreta como el total de OVIO.
- No se modifica el sistema de registro ni se abren automáticamente las inscripciones.
- No incluye correos masivos, invitaciones automáticas ni seguimiento individual sin consentimiento.
