# OVIO v0.9 — Guía de pruebas

Usa una copia de seguridad y cuentas de prueba; no compartas contraseñas o claves privadas.

## Instalación

- [ ] Ejecutar **solo** `008_mixes_y_albumes_guardados.sql` sobre Supabase ya actualizado a 007.
- [ ] Verificar que `saved_releases` aparece en Table Editor.
- [ ] Copiar `App.jsx`, `style.css` y `mixes.js` y conservar `.env`.
- [ ] Ejecutar `npm test`, `npm run build` y `npm run dev` sin errores.

## Recomendaciones

- [ ] Abrir Inicio con canciones aprobadas: aparecen los tres mixes y su contenido pertenece al catálogo aprobado.
- [ ] Pulsar **Escuchar** en un mix: suena la primera canción y «Siguiente» usa las demás pistas de ese mix.
- [ ] Dar «Me gusta» a canciones de un género y seguir un artista; comprobar después de recargar que «A tu ritmo» cambia cuando el catálogo permite alternativas.
- [ ] Abrir Descubrir: aparecen las playlists sugeridas.
- [ ] En cuenta sin música aprobada accesible, comprobar que no aparecen canciones ficticias.

## Guardar mixes

- [ ] Pulsar «Guardar como playlist» en un mix: se crea una **nueva lista privada**, visible en Biblioteca.
- [ ] La playlist se puede abrir, reproducir y editar como una lista normal.
- [ ] La playlist **no** cambia automáticamente cuando cambian las recomendaciones.
- [ ] Otra cuenta no puede ver esa playlist privada por enlace.

## Álbumes

- [ ] Abrir un álbum con al menos una canción aprobada y pulsar **Guardar álbum**.
- [ ] El álbum aparece en Biblioteca → «Álbumes guardados» tras volver a iniciar sesión en otro navegador.
- [ ] Pulsar **Guardado** otra vez lo elimina de la biblioteca pero **no elimina el álbum original**.
- [ ] Álbum sin ninguna pista aprobada: otro usuario no puede verlo ni guardarlo.
- [ ] La sección de álbumes sugeridos solo incluye álbumes con canciones aprobadas y excluye los ya guardados.

## Permisos (imprescindible)

- [ ] Cuenta A guarda un álbum; cuenta B no lo ve como guardado en su biblioteca.
- [ ] Cuenta B no puede insertar ni borrar filas de `saved_releases` con el `user_id` de A (RLS debe rechazarlo).
- [ ] Ninguna cuenta puede guardar un álbum sin pistas `approved`.
- [ ] Canción `pending` o `rejected` jamás aparece en un mix ni en recomendaciones.
- [ ] Verificar que los cambios no han alterado permisos para audio privado, documentos de autoría ni moderación.

## Regresiones

- [ ] Registro y login, playlists públicas/privadas, favoritos y seguimiento funcionan.
- [ ] Las funciones v0.8 del reproductor (cola, repetir, aleatorio, progreso opcional) siguen funcionando.
- [ ] Moderación, subida de canciones, Recap y panel de estadísticas siguen funcionando.
- [ ] Probar interfaz móvil y escritorio; no hay desbordamientos en tarjetas de mixes.

### Precauciones

Los mixes se calculan sobre los registros cargados por la interfaz (en beta se utiliza un límite de 1.000 filas por consulta). Todavía no existe paginación ni un sistema de recomendaciones de gran escala. Tampoco hay pruebas end-to-end automatizadas ni verificación en el Supabase real del usuario.
