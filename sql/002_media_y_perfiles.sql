-- OVIO Beta v0.3 — EJECUTAR UNA SOLA VEZ después de 001_initial.sql.
-- Migración aditiva: mantiene usuarios, canciones, revisiones y playlists existentes.

-- Single con portada propia y álbumes con orden explícito de canciones.
alter table public.tracks add column if not exists cover_path text;
alter table public.tracks add column if not exists track_number integer not null default 1;
alter table public.profiles add column if not exists banner_path text;

do $$
begin
 if not exists (select 1 from pg_constraint where conname='ovio_track_cover_owner' and conrelid='public.tracks'::regclass) then
  alter table public.tracks add constraint ovio_track_cover_owner
    check (cover_path is null or split_part(cover_path, '/', 1)=artist_id::text);
 end if;
 if not exists (select 1 from pg_constraint where conname='ovio_track_number_range' and conrelid='public.tracks'::regclass) then
  alter table public.tracks add constraint ovio_track_number_range check (track_number between 1 and 99);
 end if;
 if not exists (select 1 from pg_constraint where conname='ovio_profile_banner_owner' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint ovio_profile_banner_owner
    check (banner_path is null or split_part(banner_path, '/', 1)=id::text);
 end if;
 if not exists (select 1 from pg_constraint where conname='ovio_release_cover_owner' and conrelid='public.releases'::regclass) then
  alter table public.releases add constraint ovio_release_cover_owner
    check (cover_path is null or split_part(cover_path, '/', 1)=artist_id::text);
 end if;
end $$;

-- Cabeceras para perfiles de artistas. Público solo para imágenes de cabecera;
-- los audios y pruebas de autoría siguen en sus buckets PRIVADOS.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('artist-banners','artist-banners',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,
 allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists artist_banners_insert on storage.objects;
create policy artist_banners_insert on storage.objects for insert to authenticated with check (
 bucket_id='artist-banners' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select public.is_approved_artist((select auth.uid())))
);
drop policy if exists artist_banners_read on storage.objects;
create policy artist_banners_read on storage.objects for select to authenticated using (bucket_id='artist-banners');

-- Permitir al creador eliminar imágenes huérfanas tras fallos, sin borrar imágenes en uso.
drop policy if exists covers_delete_orphans on storage.objects;
create policy covers_delete_orphans on storage.objects for delete to authenticated using (
 bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.releases r where r.cover_path=name)
 and not exists(select 1 from public.tracks t where t.cover_path=name)
);
drop policy if exists artist_banners_delete_orphans on storage.objects;
create policy artist_banners_delete_orphans on storage.objects for delete to authenticated using (
 bucket_id='artist-banners' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.profiles p where p.banner_path=name)
);

-- Índice para recuentos por artista.
create index if not exists follows_artist_idx on public.follows(artist_id);

-- Recuento agregado de seguidores de artistas aprobados, sin revelar quién sigue a quién.
create or replace function public.artist_follower_counts()
returns table (artist_id uuid, follower_count bigint)
language sql stable security definer set search_path = '' as $$
 select a.user_id as artist_id, count(f.user_id)::bigint as follower_count
 from public.artist_applications a
 left join public.follows f on f.artist_id = a.user_id
 where a.status='approved'
 group by a.user_id;
$$;
revoke all on function public.artist_follower_counts() from public, anon;
grant execute on function public.artist_follower_counts() to authenticated;

-- Nota: la revisión y los estados de canciones siguen protegidos por RLS.
-- La portada del álbum se mantiene editable SOLO mientras no existan canciones aprobadas.
