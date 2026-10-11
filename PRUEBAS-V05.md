# Lista de comprobación · OVIO v0.5

## Preparación

- [ ] Ejecutar `004_comunidad_descubrimiento.sql` en SQL Editor. No ejecutar otra vez 001, 002 ni 003.
- [ ] Probar `npm run build` en tu máquina. Si falla, no desplegar hasta resolverlo.
- [ ] Abrir OVIO con dos cuentas de usuario (A oyente y B artista aprobado) y una cuenta administradora (C). Mejor probar en ventanas privadas separadas.

## Playlists y privacidad

1. A crea una playlist **privada**. B no debe verla en Comunidad ni poder abrirla con el enlace.
2. A cambia la playlist a **pública**. B debe verla en Comunidad y poder entrar.
3. B pulsa **Guardar lista**. Debe aparecer en **Biblioteca → Playlists guardadas**.
4. B pulsa otra vez **Guardada**. Desaparece de su biblioteca.
5. A hace privada la playlist. B no debe poder verla aunque hubiese guardado la lista previamente.

## Perfil de oyente

1. A edita su nombre, bio y foto en **Perfil**.
2. A abre **Ver perfil público**: debe mostrar su información y únicamente sus playlists públicas.
3. B abre la playlist pública de A y pulsa el nombre de su creador para visitar el perfil. No debe aparecer correo ni playlists privadas.

## Novedades de artista

1. B entra en **OVIO Studio → Publicar novedad**, introduce un mensaje y opcionalmente una canción propia aprobada.
2. La novedad queda **pendiente** y no aparece en Comunidad a los otros usuarios.
3. C abre **Moderación → Novedades pendientes** y la aprueba. Aparece en Comunidad y en el perfil público de B.
4. B debe recibir una notificación de aprobación en OVIO.
5. B envía otra novedad y C la rechaza con un motivo. B ve motivo y aviso; A no ve esa novedad.
6. A denuncia una novedad aprobada. C comprueba la denuncia, la retira si corresponde y marca el expediente resuelto. La novedad ya no debe verse públicamente.
7. B intenta enviar cuatro novedades en menos de 24 horas: la cuarta debe ser rechazada por el límite de servidor.
8. Un oyente no aprobado intenta usar la API para insertar una novedad o actualizar estados: debe fallar por RLS o privilegios de columna.

## Recomendaciones

1. A da me gusta a varias canciones de un género musical.
2. En Inicio se priorizan canciones compatibles, pero se mezclan creadores.
3. A sigue a B: sus nuevos lanzamientos aprobados aparecen en **Novedades de artistas que sigues**.
4. Las canciones sin aprobación siguen ocultas, incluso con enlace directo.

## Regresiones

- [ ] Registro/inicio de sesión.
- [ ] Aprobación de solicitudes de artista y canciones.
- [ ] Subida de audio y portada; audio pendiente privado.
- [ ] Álbumes y EPs.
- [ ] Favoritos y reproductor.
- [ ] Notificaciones v0.4 y filtros de catálogo.
- [ ] Diseño móvil: barra inferior, reproductor, modales con desplazamiento.

**Importante:** pruebas manuales pendientes de ejecutar contra tu Supabase real. Que el SQL responda «Success» no sustituye comprobar RLS y los casos de privacidad.
