-- OVIO Beta v1.2 · Refuerzo de permisos (compatible con 001–009)
-- HACER COPIA DE SEGURIDAD Y LEER README-V12.md ANTES DE EJECUTAR.
-- No elimina tablas, usuarios, canciones ni playlists. Ejecutar como administrador en SQL Editor.
-- Cambios: restringir columnas editables y operaciones, proteger favoritos/seguimientos/listas,
-- y reafirmar buckets privados. La transacción se revierte ante cualquier error.

begin;

-- 1. El usuario puede editar solo campos de su perfil, nunca id ni created_at.
-- La protección de PROPIEDAD de la fila continúa bajo la política RLS profiles_update.
revoke insert, update, delete on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, bio, city, username, avatar_path, banner_path)
  on table public.profiles to authenticated;

-- 2. Solicitudes de artista: alta limitada a datos de solicitud; la aprobación
-- requiere adicionalmente la política artists_review (is_admin() servidor).
revoke insert, update, delete on table public.artist_applications from anon, authenticated;
grant select on table public.artist_applications to authenticated;
grant insert (user_id, artist_name, genre, bio)
  on table public.artist_applications to authenticated;
grant update (status, review_note, reviewed_at)
  on table public.artist_applications to authenticated;

-- 3. Pistas: artistas solo crean canciones pendientes; solo el moderador puede
-- cambiar su estado y notas. Los metadatos pendientes se editan por RPC validada.
revoke insert, update, delete on table public.tracks from anon, authenticated;
grant select on table public.tracks to authenticated;
grant insert (id, artist_id, release_id, title, genre, audio_path,
 evidence_path, cover_path, duration_seconds, track_number, rights_original)
  on table public.tracks to authenticated;
grant update (status, review_note, reviewed_at)
  on table public.tracks to authenticated;

-- 4. Evitar crear una biblioteca de contenido que aún no está aprobado.
drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert to authenticated
 with check (
  user_id = (select auth.uid()) and
  exists (select 1 from public.tracks t
          where t.id = track_id and t.status = 'approved')
 );

drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated
 with check (
  user_id = (select auth.uid()) and
  artist_id <> (select auth.uid()) and
  public.is_approved_artist(artist_id)
 );

drop policy if exists playlist_tracks_insert on public.playlist_tracks;
create policy playlist_tracks_insert on public.playlist_tracks for insert to authenticated
 with check (
  exists (select 1 from public.playlists p
          where p.id = playlist_id and p.owner_id = (select auth.uid()))
  and exists (select 1 from public.tracks t
          where t.id = track_id and t.status = 'approved')
 );

-- 5. Un administrador puede usar URLs firmadas para el audio y evidencia privada;
-- nunca habilitaremos acceso público a estos dos buckets.
update storage.buckets set public = false
 where id in ('song-audio','song-evidence');

commit;
