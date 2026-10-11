# Lista de pruebas de OVIO Beta v0.6

**Ejecuta solo la migración 005 en una copia de tu Supabase cuando sea posible.** Haz backup antes y conserva el `.env`.

## 1. Instalación

- [ ] `005_rankings_resumen.sql` se ejecuta sin errores después de 001–004.
- [ ] Existen tablas `listening_settings` y `playback_sessions`.
- [ ] La web arranca (`npm run dev`) y compila (`npm run build`).
- [ ] Inicio, búsqueda, biblioteca, OVIO Studio, perfiles y moderación de v0.5 siguen funcionando.

## 2. Privacidad

- [ ] Inicia sesión como oyente A. En Perfil, habilita estadísticas y escoge España. Guarda.
- [ ] Cierra sesión, vuelve a entrar y confirma que se conservan las preferencias.
- [ ] Intenta consultar `playback_sessions` directamente desde un cliente con clave pública: **no debe mostrar eventos**.
- [ ] Con la misma clave pública, no debes poder registrar ni modificar sesiones sin la función RPC autorizada.
- [ ] Desactiva estadísticas. Comprueba que las sesiones del usuario A se borran.
- [ ] Reactiva estadísticas. Comprueba que el contador comienza de nuevo, sin historial restaurado.

## 3. Reproducción real

- [ ] Con estadísticas activadas, reproduce una canción aprobada al menos 30 segundos. Debe registrar progresivamente el tiempo.
- [ ] Pausa: el tiempo acumulado debe dejar de aumentar.
- [ ] Busca de golpe el minuto 3: no debe contabilizar 3 minutos automáticamente.
- [ ] Reproduce otro tema: deben mantenerse sesiones distintas.
- [ ] Una canción pendiente de aprobación NO debe aparecer en los rankings.

## 4. Tops mensuales

- [ ] Inicia reproducción válida desde **tres usuarios de prueba diferentes** (mejor en navegadores/perfiles distintos) para una canción aprobada.
- [ ] Recarga la pantalla «Top OVIO» y comprueba que la canción aparece. Con uno o dos oyentes no debe mostrarse.
- [ ] Filtra por Rap o Pop y comprueba los resultados por género.
- [ ] Para «Éxitos España», al menos tres usuarios deben haber elegido España voluntariamente antes de reproducir.
- [ ] Comprueba cambios de mes y que no se muestren datos de otros períodos.
- [ ] Retira una canción por moderación: su resultado público debe desaparecer al recargar.

## 5. Mi año

- [ ] Abre «Mi año en OVIO» con estadísticas activadas. El resumen solo debe reflejar sesiones nuevas.
- [ ] Comprueba minutos, canción, artista y género favoritos.
- [ ] Prueba «Copiar mi resumen»; no debe publicar nada sin tu acción.
- [ ] Hasta el 24 de noviembre debería mostrar un avance, no una edición final.
- [ ] A partir del 25 de noviembre (UTC), el inicio debe ofrecer «Tu año en OVIO» y el recap aparecer como final. Se necesita una prueba controlada de fecha en desarrollo; no cambies la hora de producción.

## 6. Qué reportar si falla

Copia **solo el mensaje de error** del SQL Editor o la consola (sin claves ni contraseñas), indica el paso y qué usuario de prueba se utilizó. No ejecutes de nuevo 001–004 ni elimines tablas para intentar solucionarlo.
