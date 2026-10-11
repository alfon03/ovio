-- OVIO Beta v0.4: notificaciones privadas y edición controlada de canciones PENDIENTES.
-- EJECUTAR SOLO DESPUÉS DE 001_initial.sql y 002_media_y_perfiles.sql.
-- No elimina datos ni cambia las políticas anteriores.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('artist_approved','artist_rejected','track_approved','track_rejected')),
  title text not null check (char_length(title) between 1 and 120),
  message text not null default '' check (char_length(message) <= 1300),
  related_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
alter table public.notifications enable row level security;

-- El navegador NUNCA podrá fabricar mensajes ni modificar su contenido.
revoke all on table public.notifications from public, anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

drop policy if exists notifications_select_self on public.notifications;
create policy notifications_select_self on public.notifications for select to authenticated
 using (user_id = (select auth.uid()));
drop policy if exists notifications_read_self on public.notifications;
create policy notifications_read_self on public.notifications for update to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Los avisos se generan DENTRO de la transacción de revisión de Supabase.
-- No dependemos de que el navegador del administrador esté conectado.
create or replace function public.notify_moderation_decision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_user uuid;
  kind text;
  label text;
  details text;
  object_id uuid;
begin
  if new.status is not distinct from old.status or new.status not in ('approved','rejected') then
    return new;
  end if;
  if tg_table_name = 'artist_applications' then
    target_user := new.user_id;
    kind := 'artist_' || new.status;
    label := 'Tu solicitud de artista';
    object_id := new.user_id;
  elsif tg_table_name = 'tracks' then
    target_user := new.artist_id;
    kind := 'track_' || new.status;
    label := 'Tu canción «' || left(new.title, 72) || '»';
    object_id := new.id;
  else
    return new;
  end if;
  details := nullif(btrim(coalesce(new.review_note, '')), '');
  insert into public.notifications (user_id, event_type, title, message, related_id)
  values (
    target_user,
    kind,
    label || case when new.status='approved' then ' ha sido aprobada' else ' ha sido rechazada' end,
    case when details is not null then left(details, 1200)
         when new.status='approved' then 'Ya puedes consultar el resultado en OVIO Studio.'
         else 'Consulta OVIO Studio para conocer el estado de la revisión.' end,
    object_id
  );
  return new;
end; $$;

drop trigger if exists notify_artist_decision on public.artist_applications;
create trigger notify_artist_decision after update of status on public.artist_applications
 for each row execute function public.notify_moderation_decision();
drop trigger if exists notify_track_decision on public.tracks;
create trigger notify_track_decision after update of status on public.tracks
 for each row execute function public.notify_moderation_decision();

-- Edición de METADATOS por el propietario, solo mientras está PENDIENTE.
-- Jamás permite tocar authoría, archivo, derechos, review_note, reviewed_at o status.
create or replace function public.update_my_pending_track(
 p_track_id uuid, p_title text, p_genre text, p_track_number integer
) returns void language plpgsql security definer set search_path = '' as $$
declare row_artist uuid; row_status text; row_release uuid;
begin
  if (select auth.uid()) is null then raise exception 'Necesitas iniciar sesión'; end if;
  select artist_id, status, release_id into row_artist, row_status, row_release
  from public.tracks where id=p_track_id for update;
  if not found or row_artist is distinct from (select auth.uid()) then
    raise exception 'Canción no encontrada o sin permisos';
  end if;
  if row_status <> 'pending' then
    raise exception 'Solo puedes editar canciones pendientes';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 100 then
    raise exception 'El título debe contener entre 1 y 100 caracteres';
  end if;
  if p_genre is null or char_length(btrim(p_genre)) not between 2 and 40 then
    raise exception 'Género no válido';
  end if;
  if p_track_number is null or p_track_number not between 1 and 99 then
    raise exception 'Número de pista no válido';
  end if;
  if row_release is null and p_track_number <> 1 then
    raise exception 'Un single independiente debe tener número de pista 1';
  end if;
  update public.tracks set
   title=btrim(p_title), genre=btrim(p_genre), track_number=p_track_number
  where id=p_track_id;
end; $$;
revoke all on function public.update_my_pending_track(uuid,text,text,integer) from public, anon;
grant execute on function public.update_my_pending_track(uuid,text,text,integer) to authenticated;

-- Nota: esta versión usa consultas normales para refrescar notificaciones.
-- No exige activar la publicación Realtime de tablas ni enviar emails.
