-- OVIO Beta v0.5 — Comunidad y descubrimiento
-- Ejecutar SOLO después de 001, 002 y 003. Migración incremental, sin borrar datos.
-- Artistas: novedades de texto sujetas a revisión. Oyentes: guardar playlists públicas.

create table if not exists public.playlist_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);
create index if not exists playlist_saves_playlist_idx on public.playlist_saves(playlist_id);
alter table public.playlist_saves enable row level security;

drop policy if exists playlist_saves_select on public.playlist_saves;
create policy playlist_saves_select on public.playlist_saves for select to authenticated
  using (user_id=(select auth.uid()) and exists (
    select 1 from public.playlists p where p.id=playlist_id and (p.is_public or p.owner_id=(select auth.uid()))
  ));
drop policy if exists playlist_saves_insert on public.playlist_saves;
create policy playlist_saves_insert on public.playlist_saves for insert to authenticated
  with check (user_id=(select auth.uid()) and exists (
    select 1 from public.playlists p where p.id=playlist_id and p.is_public and p.owner_id<>(select auth.uid())
  ));
drop policy if exists playlist_saves_delete on public.playlist_saves;
create policy playlist_saves_delete on public.playlist_saves for delete to authenticated
  using (user_id=(select auth.uid()));

-- Novedades: solo texto breve. No se muestran antes de que un administrador las apruebe.
create table if not exists public.artist_updates (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 10 and 500),
  track_id uuid references public.tracks(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '' check (char_length(review_note)<=1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists artist_updates_public_idx on public.artist_updates(created_at desc) where status='approved';
create index if not exists artist_updates_artist_idx on public.artist_updates(artist_id,created_at desc);
alter table public.artist_updates enable row level security;

-- Nunca permitir vincular publicaciones a canciones ajenas o no aprobadas.
create or replace function public.validate_artist_update()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not public.is_approved_artist(new.artist_id) then
    raise exception 'Perfil de artista no aprobado';
  end if;
  perform 1 from public.profiles where id=new.artist_id for update;
  if (select count(*) from public.artist_updates where artist_id=new.artist_id
       and created_at > now()-interval '24 hours') >= 3 then
    raise exception 'Límite beta: 3 novedades por artista cada 24 horas';
  end if;
  if new.track_id is not null and not exists (
    select 1 from public.tracks t where t.id=new.track_id
      and t.artist_id=new.artist_id and t.status='approved'
  ) then
    raise exception 'Solo puedes enlazar una canción propia y aprobada';
  end if;
  return new;
end; $$;
drop trigger if exists validate_artist_update_insert on public.artist_updates;
create trigger validate_artist_update_insert before insert on public.artist_updates
  for each row execute function public.validate_artist_update();

drop policy if exists artist_updates_read on public.artist_updates;
create policy artist_updates_read on public.artist_updates for select to authenticated
  using (status='approved' or artist_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists artist_updates_insert on public.artist_updates;
create policy artist_updates_insert on public.artist_updates for insert to authenticated
  with check (artist_id=(select auth.uid()) and (select public.is_approved_artist((select auth.uid())))
    and status='pending' and review_note='' and reviewed_at is null);
drop policy if exists artist_updates_review on public.artist_updates;
create policy artist_updates_review on public.artist_updates for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Para reducir ataques del frontend, sólo el administrador podrá actualizar estos campos
-- (RLS sigue comprobando is_admin en el servidor).
revoke all on public.artist_updates from anon, authenticated;
grant select on public.artist_updates to authenticated;
grant insert (artist_id,body,track_id) on public.artist_updates to authenticated;
grant update (status,review_note,reviewed_at) on public.artist_updates to authenticated;

-- Auditoría de las decisiones (y retiradas) de publicaciones.
drop trigger if exists log_artist_update_decision on public.artist_updates;
create trigger log_artist_update_decision after update of status on public.artist_updates
  for each row execute function public.log_moderation_change();

-- Nuevos tipos de notificación, generados exclusivamente en el servidor.
alter table public.notifications drop constraint if exists notifications_event_type_check;
alter table public.notifications add constraint notifications_event_type_check
  check (event_type in ('artist_approved','artist_rejected','track_approved','track_rejected',
                       'update_approved','update_rejected'));

create or replace function public.notify_artist_update_decision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected') then
    insert into public.notifications (user_id,event_type,title,message,related_id)
    values (new.artist_id,
      'update_'||new.status,
      case when new.status='approved' then 'Tu publicación ha sido aprobada'
           else 'Tu publicación ha sido rechazada' end,
      case when btrim(coalesce(new.review_note,''))<>'' then left(new.review_note,1200)
           else 'Consulta OVIO Studio para ver el estado de tu publicación.' end,
      new.id);
  end if;
  return new;
end; $$;
drop trigger if exists notify_artist_update_decision on public.artist_updates;
create trigger notify_artist_update_decision after update of status on public.artist_updates
  for each row execute function public.notify_artist_update_decision();

-- Las políticas de tracks, audio, playlists privadas y solicitudes anteriores no cambian.
-- RLS protege también si un cliente intenta llamar la API directamente.

-- Denuncias de publicaciones: seguimiento de avisos y retirada de textos problemáticos.
create table if not exists public.artist_update_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 update_id uuid not null references public.artist_updates(id) on delete cascade,
 reason text not null check (char_length(btrim(reason)) between 15 and 1500),
 status text not null default 'open' check (status in ('open','resolved')),
 created_at timestamptz not null default now(),
 unique (reporter_id, update_id)
);
alter table public.artist_update_reports enable row level security;
create index if not exists artist_update_reports_open_idx on public.artist_update_reports(created_at desc) where status='open';

drop policy if exists artist_update_reports_read on public.artist_update_reports;
create policy artist_update_reports_read on public.artist_update_reports for select to authenticated
 using (reporter_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists artist_update_reports_insert on public.artist_update_reports;
create policy artist_update_reports_insert on public.artist_update_reports for insert to authenticated
 with check (reporter_id=(select auth.uid()) and status='open' and exists (
  select 1 from public.artist_updates u where u.id=update_id and u.status='approved'
 ));
drop policy if exists artist_update_reports_admin on public.artist_update_reports;
create policy artist_update_reports_admin on public.artist_update_reports for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.artist_update_reports from anon, authenticated;
grant select, insert on public.artist_update_reports to authenticated;
grant update (status) on public.artist_update_reports to authenticated;

revoke all on public.playlist_saves from anon;
grant select, insert, delete on public.playlist_saves to authenticated;
