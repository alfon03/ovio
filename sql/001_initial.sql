-- OVIO Beta · ejecutar UNA VEZ en Supabase SQL Editor.
-- Cuentas/contraseñas: Supabase Auth. Nunca guardar contraseñas en tablas públicas.
-- Políticas RLS: no confiar en los roles enviados por la interfaz.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Oyente' check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 500),
  city text not null default '' check (char_length(city) <= 80),
  avatar_path text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name',''), 'Nuevo oyente'), 60));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create table if not exists public.artist_applications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  artist_name text not null check (char_length(artist_name) between 2 and 70),
  genre text not null check (char_length(genre) between 2 and 40),
  bio text not null default '' check (char_length(bio) <= 600),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- Vista limitada: datos públicos del artista, SIN notas internas de moderación.
create or replace view public.artists_public as
select user_id, artist_name, genre, bio, status, created_at
from public.artist_applications where status='approved';
grant select on public.artists_public to authenticated;

create or replace function public.is_approved_artist(account uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.artist_applications where user_id = account and status = 'approved');
$$;

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 90),
  kind text not null default 'album' check (kind in ('album','ep')),
  description text not null default '' check (char_length(description) <= 1000),
  cover_path text,
  created_at timestamptz not null default now(),
  unique(id,artist_id)
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  release_id uuid,
  title text not null check (char_length(title) between 1 and 100),
  genre text not null check (char_length(genre) between 2 and 40),
  audio_path text not null,
  evidence_path text,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 36000),
  rights_original boolean not null check (rights_original = true),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint path_belongs_to_artist check (split_part(audio_path,'/',1) = artist_id::text),
  constraint evidence_belongs_to_artist check (evidence_path is null or split_part(evidence_path,'/',1) = artist_id::text),
  foreign key (release_id,artist_id) references public.releases(id,artist_id) on delete set null (release_id)
);
create index if not exists tracks_artist_idx on public.tracks(artist_id,created_at desc);
create index if not exists tracks_status_idx on public.tracks(status,created_at desc);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,track_id)
);
create table if not exists public.follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,artist_id),
  constraint not_follow_self check (user_id <> artist_id)
);
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 75),
  description text not null default '' check (char_length(description) <= 250),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (playlist_id,track_id)
);
create table if not exists public.listen_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  listened_on date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique(user_id,track_id,listened_on)
);
create index if not exists listen_track_idx on public.listen_events(track_id);

-- Registro de decisiones de moderación. Se rellena automáticamente en servidor.
create table if not exists public.moderation_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  object_type text not null,
  object_id uuid not null,
  before_status text,
  after_status text,
  created_at timestamptz not null default now()
);
create or replace function public.log_moderation_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.moderation_log (actor_id,object_type,object_id,before_status,after_status)
    values ((select auth.uid()),TG_TABLE_NAME,
      coalesce((to_jsonb(new)->>'id')::uuid,(to_jsonb(new)->>'user_id')::uuid),old.status,new.status);
  end if;
  return new;
end; $$;
drop trigger if exists log_artist_decision on public.artist_applications;
create trigger log_artist_decision after update of status on public.artist_applications
for each row execute function public.log_moderation_change();
drop trigger if exists log_track_decision on public.tracks;
create trigger log_track_decision after update of status on public.tracks
for each row execute function public.log_moderation_change();

-- Evitar subir cientos de archivos durante la beta: máximo cinco canciones
-- aprobadas/pendientes por artista; un rechazo libera plaza.
create or replace function public.enforce_beta_track_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles where id = new.artist_id for update;
  if (select count(*) from public.tracks
      where artist_id = new.artist_id and status <> 'rejected') >= 5 then
    raise exception 'Límite beta: máximo 5 canciones activas por artista';
  end if;
  return new;
end; $$;
drop trigger if exists enforce_track_limit on public.tracks;
create trigger enforce_track_limit before insert on public.tracks
for each row execute function public.enforce_beta_track_limit();

create table if not exists public.copyright_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  reason text not null check (char_length(reason) between 15 and 2000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.artist_applications enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.listen_events enable row level security;
alter table public.copyright_reports enable row level security;
alter table public.moderation_log enable row level security;

drop policy if exists moderation_log_admin_read on public.moderation_log;
create policy moderation_log_admin_read on public.moderation_log for select to authenticated using ((select public.is_admin()));

-- Perfiles: todos los usuarios autenticados pueden encontrar artistas/oyentes.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Roles administrativos: inserción exclusivamente desde SQL Editor/Service Role.
drop policy if exists admins_self_read on public.admin_users;
create policy admins_self_read on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

-- Un artista solo puede solicitar el estado "pending"; NO puede aprobarse a sí mismo.
drop policy if exists artists_read on public.artist_applications;
create policy artists_read on public.artist_applications for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists artists_apply on public.artist_applications;
create policy artists_apply on public.artist_applications for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and review_note = '' and reviewed_at is null);
drop policy if exists artists_review on public.artist_applications;
create policy artists_review on public.artist_applications for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Álbum privado mientras no hay canciones aprobadas.
drop policy if exists releases_read on public.releases;
create policy releases_read on public.releases for select to authenticated using (
 artist_id = (select auth.uid()) or (select public.is_admin()) or
 exists (select 1 from public.tracks t where t.release_id = releases.id and t.status='approved')
);
drop policy if exists releases_insert on public.releases;
create policy releases_insert on public.releases for insert to authenticated with check (artist_id = (select auth.uid()) and public.is_approved_artist((select auth.uid())));
drop policy if exists releases_update on public.releases;
create policy releases_update on public.releases for update to authenticated using (artist_id = (select auth.uid()) and not exists(select 1 from public.tracks t where t.release_id = releases.id and t.status='approved'))
with check (artist_id = (select auth.uid()));

-- Solo música revisada es pública; autor y moderador pueden ver el pendiente.
drop policy if exists tracks_read on public.tracks;
create policy tracks_read on public.tracks for select to authenticated using (status = 'approved' or artist_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists tracks_upload on public.tracks;
create policy tracks_upload on public.tracks for insert to authenticated with check (
 artist_id = (select auth.uid()) and public.is_approved_artist((select auth.uid())) and status='pending' and review_note='' and reviewed_at is null
);
drop policy if exists tracks_review on public.tracks;
create policy tracks_review on public.tracks for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Biblioteca personal.
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));
drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows for delete to authenticated using (user_id = (select auth.uid()));

-- Playlists públicas visibles para usuarios registrados; privadas solo para dueño.
drop policy if exists playlists_read on public.playlists;
create policy playlists_read on public.playlists for select to authenticated using (is_public or owner_id = (select auth.uid()));
drop policy if exists playlists_insert on public.playlists;
create policy playlists_insert on public.playlists for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists playlists_update on public.playlists;
create policy playlists_update on public.playlists for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists playlists_delete on public.playlists;
create policy playlists_delete on public.playlists for delete to authenticated using (owner_id = (select auth.uid()));
drop policy if exists playlist_tracks_read on public.playlist_tracks;
create policy playlist_tracks_read on public.playlist_tracks for select to authenticated using (
 exists(select 1 from public.playlists p where p.id = playlist_id and (p.is_public or p.owner_id=(select auth.uid())))
);
drop policy if exists playlist_tracks_insert on public.playlist_tracks;
create policy playlist_tracks_insert on public.playlist_tracks for insert to authenticated with check (
 exists(select 1 from public.playlists p where p.id = playlist_id and p.owner_id=(select auth.uid()))
);
drop policy if exists playlist_tracks_delete on public.playlist_tracks;
create policy playlist_tracks_delete on public.playlist_tracks for delete to authenticated using (
 exists(select 1 from public.playlists p where p.id = playlist_id and p.owner_id=(select auth.uid()))
);

-- Beta: una escucha contable por oyente/canción/día. NO usar para pagos a artistas.
drop policy if exists listens_read on public.listen_events;
create policy listens_read on public.listen_events for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists listens_insert on public.listen_events;
create policy listens_insert on public.listen_events for insert to authenticated with check (
 user_id=(select auth.uid()) and listened_on = (now() at time zone 'utc')::date and
 exists(select 1 from public.tracks t where t.id=track_id and t.status='approved')
);

-- Reclamaciones: usuario puede denunciar música; moderadores pueden resolver.
drop policy if exists reports_read on public.copyright_reports;
create policy reports_read on public.copyright_reports for select to authenticated using (reporter_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists reports_create on public.copyright_reports;
create policy reports_create on public.copyright_reports for insert to authenticated with check (reporter_id=(select auth.uid()) and status='open');
drop policy if exists reports_review on public.copyright_reports;
create policy reports_review on public.copyright_reports for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Estadísticas agregadas para autores sin exponer los historiales de escucha de usuarios.
create or replace function public.my_track_stats()
returns table(track_id uuid, listens bigint, listeners bigint)
language sql stable security definer set search_path = '' as $$
  select t.id as track_id, count(le.id)::bigint as listens,
         count(distinct le.user_id)::bigint as listeners
  from public.tracks t left join public.listen_events le on le.track_id = t.id
  where t.artist_id = (select auth.uid())
  group by t.id;
$$;
revoke execute on function public.my_track_stats() from public, anon;
grant execute on function public.my_track_stats() to authenticated;

-- Storage: privado para audio, público para portadas y avatares.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('song-audio','song-audio',false,31457280,array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave'])
on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('song-evidence','song-evidence',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('covers','covers',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists audio_insert on storage.objects;
create policy audio_insert on storage.objects for insert to authenticated with check (
 bucket_id='song-audio' and (storage.foldername(name))[1]=(select auth.uid())::text
 and public.is_approved_artist((select auth.uid()))
);
drop policy if exists audio_read on storage.objects;
create policy audio_read on storage.objects for select to authenticated using (
 bucket_id='song-audio' and (
 (storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()) or
 exists(select 1 from public.tracks t where t.audio_path=name and t.status='approved')
 ));
drop policy if exists audio_delete on storage.objects;
create policy audio_delete on storage.objects for delete to authenticated using (
 bucket_id='song-audio' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.tracks t where t.audio_path=name)
);

drop policy if exists evidence_insert on storage.objects;
create policy evidence_insert on storage.objects for insert to authenticated with check (
 bucket_id='song-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text
 and public.is_approved_artist((select auth.uid()))
);
drop policy if exists evidence_read on storage.objects;
create policy evidence_read on storage.objects for select to authenticated using (
 bucket_id='song-evidence' and (
 (storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin())
 ));
drop policy if exists evidence_delete on storage.objects;
create policy evidence_delete on storage.objects for delete to authenticated using (
 bucket_id='song-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.tracks t where t.evidence_path=name)
);

drop policy if exists covers_insert on storage.objects;
create policy covers_insert on storage.objects for insert to authenticated with check (
 bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text
 and public.is_approved_artist((select auth.uid()))
);
drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects for select to authenticated using (bucket_id='covers');
drop policy if exists avatars_insert on storage.objects;
create policy avatars_insert on storage.objects for insert to authenticated with check (
 bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select to authenticated using (bucket_id='avatars');

-- Cómo crear el primer administrador:
-- 1. Regístrate en OVIO y confirma tu email.
-- 2. Supabase Dashboard → Authentication → Users: copia tu UUID.
-- 3. Ejecuta esta instrucción sustituyendo el UUID:
-- insert into public.admin_users (user_id) values ('PON_AQUI_TU_UUID');
