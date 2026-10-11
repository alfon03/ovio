# OVIO Beta v0.3 — checklist de pruebas

> Utiliza dos cuentas: (A) artista aprobado, (B) oyente. Mantén tu administrador separado si es posible.

1. En Supabase SQL Editor ejecuta `002_media_y_perfiles.sql`. Confirma que no hubo errores.
2. Abre OVIO como artista aprobado y entra a **OVIO Studio**.
3. Cambia tu **cabecera de artista**, y revisa el resultado en **Ver mi perfil público**. Añade también una foto en **Tu perfil** si quieres.
4. Pulsa **Compartir perfil**, copia el enlace y ábrelo desde una sesión de otro usuario. El perfil debe mostrarse si el artista está aprobado. Si no hay sesión se pedirá iniciar sesión.
5. Crea un álbum o EP con portada: comprueba la previsualización antes de guardar. Edita portada y descripción ANTES de tener canciones aprobadas.
6. Sube una canción al álbum con número de pista 2 y otra con número 1. Añade sus pruebas de autoría si quieres. Comprueba que ambas quedan **Pendientes** y que el oyente no las encuentra todavía.
7. Sube un **single independiente**, asigna una portada y verifica que se ve en tu estudio mientras está pendiente.
8. Desde la cuenta de administrador, entra a **Moderación**, comprueba la miniatura de portada, escucha el archivo original y revisa la evidencia si existe.
9. Aprueba un single y una pista de álbum. En la cuenta de oyente, busca ambas y comprueba portada, duración y reproducción. El álbum debe ordenar las pistas por número entre las que ya están aprobadas.
10. Tras aprobar al menos un tema del álbum, comprueba que la edición del álbum deja de ofrecerse en Studio.
11. Sigue al artista desde la cuenta de oyente y comprueba que se actualiza el número de seguidores tras refrescar.
12. En móvil, comprueba que la cabecera, listas, reproductor y formularios se adaptan a la pantalla.
13. Prueba archivos inválidos: imagen de más de 5 MB o audio de más de 30 MB. Deben rechazarse. Nunca subas música de terceros sin autorización.

## Si algo falla

- `column tracks.cover_path does not exist`: no se ejecutó correctamente `002_media_y_perfiles.sql`.
- `function artist_follower_counts does not exist`: vuelve a revisar el resultado de esa migración.
- `Bucket not found`: revisa que aparece `artist-banners` en Supabase → Storage.
- `new row violates row-level security policy`: revisa que la cuenta sea un artista aprobado, que la sesión esté activa y que `002_media_y_perfiles.sql` haya creado sus políticas.
- Error de subida: comprueba formato/tamaño y que los buckets existentes sean los correctos; no desactives RLS para solucionar errores.

En caso de error, guarda el mensaje completo pero no compartas credenciales, tokens o enlaces privados a pruebas de autoría.
