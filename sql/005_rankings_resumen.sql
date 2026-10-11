-- OVIO v0.6: métricas de escucha, rankings y resumen personal.
-- Aplicar UNA VEZ después de 001, 002, 003 y 004; no elimina ninguna tabla previa.
-- El historial anterior no registra segundos reproducidos y NO se convierte en minutos ficticios.

create table if not exists public.listening_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  country_code text not null default 'ZZ' check (country_code in ('ZZ','ES','OT')),
  analytics_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.listening_settings enable row level security;
revoke all on public.listening_settings from anon, authenticated;
grant select, insert, update (country_code,analytics_enabled,updated_at), delete on public.listening_settings to authenticated;
drop policy if exists listening_settings_read on public.listening_settings;
create policy listening_settings_read on public.listening_settings for select to authenticated
  using (user_id=(select auth.uid()));
drop policy if exists listening_settings_insert on public.listening_settings;
create policy listening_settings_insert on public.listening_settings for insert to authenticated
  with check (user_id=(select auth.uid()));
drop policy if exists listening_settings_update on public.listening_settings;
create policy listening_settings_update on public.listening_settings for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists listening_settings_delete on public.listening_settings;
create policy listening_settings_delete on public.listening_settings for delete to authenticated
  using (user_id=(select auth.uid()));

create table if not exists public.playback_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  session_key uuid not null,
  country_code text not null default 'ZZ' check(country_code in ('ZZ','ES','OT')),
  played_seconds integer not null default 0 check (played_seconds between 0 and 36000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,session_key)
);
create index if not exists playback_sessions_utc_idx on public.playback_sessions(created_at desc);
create index if not exists playback_sessions_track_idx on public.playback_sessions(track_id,created_at desc);
create index if not exists playback_sessions_user_idx on public.playback_sessions(user_id,created_at desc);
alter table public.playback_sessions enable row level security;
revoke all on public.playback_sessions from anon,authenticated;
-- Ni el cliente ni otros usuarios pueden consultar, insertar ni manipular eventos crudos.
-- El registro solo se hace mediante la función validada de abajo.

create or replace function public.record_ovio_progress(
  p_track_id uuid, p_session_key uuid, p_played_seconds integer
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_duration integer;
  v_record public.playback_sessions%rowtype;
  v_elapsed integer;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  if not exists(select 1 from public.listening_settings
                where user_id=v_uid and analytics_enabled=true) then
    raise exception 'Activa voluntariamente las estadísticas de escucha';
  end if;
  select duration_seconds into v_duration from public.tracks
    where id=p_track_id and status='approved';
  if not found then raise exception 'Canción no disponible'; end if;
  if p_session_key is null or p_played_seconds is null or p_played_seconds<0
     or p_played_seconds>least(36000,(case when v_duration<=0 then 3600 else v_duration end)+5) then
    raise exception 'Progreso inválido';
  end if;
  -- Evita crear miles de sesiones para hinchar las clasificaciones.
  -- Protección beta: complementarla más adelante con límites de red y detección de bots.
  perform pg_advisory_xact_lock(hashtext(v_uid::text));
  select * into v_record from public.playback_sessions
    where user_id=v_uid and session_key=p_session_key for update;
  if not found then
    if (select count(*) from public.playback_sessions
        where user_id=v_uid and created_at>now()-interval '1 hour') >= 40 then
      raise exception 'Demasiadas reproducciones iniciadas; inténtalo más tarde';
    end if;
    insert into public.playback_sessions(user_id,track_id,session_key,played_seconds,country_code)
      values(v_uid,p_track_id,p_session_key,0,
        (select country_code from public.listening_settings where user_id=v_uid))
      returning * into v_record;
  end if;
  if v_record.track_id<>p_track_id then raise exception 'Sesión pertenece a otra canción'; end if;
  v_elapsed:=greatest(0,floor(extract(epoch from (now()-v_record.created_at)))::integer);
  if p_played_seconds>v_elapsed+8 then
    raise exception 'Progreso superior al tiempo transcurrido';
  end if;
  update public.playback_sessions set played_seconds=greatest(played_seconds,p_played_seconds),updated_at=now()
    where id=v_record.id;
  return true;
end; $$;
revoke all on function public.record_ovio_progress(uuid,uuid,integer) from public,anon;
grant execute on function public.record_ovio_progress(uuid,uuid,integer) to authenticated;

-- El ranking solo publica agregados de canciones aprobadas y exige al menos
-- tres oyentes distintos por canción, artista y género, por privacidad.
create or replace function public.get_ovio_charts(
  p_year integer, p_month integer, p_country text default 'ALL', p_genre text default 'Todos'
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_start timestamptz; v_end timestamptz; v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Debes iniciar sesión'; end if;
  if p_year not between 2024 and 2100 or p_month not between 1 and 12
     or p_country not in ('ALL','ES') or char_length(p_genre)>40 then
    raise exception 'Filtros no válidos';
  end if;
  v_start:=make_date(p_year,p_month,1)::timestamptz;
  v_end:=v_start+interval '1 month';
  with qualified as (
    select t.id track_id,t.title,t.artist_id,t.genre,ps.user_id,
      a.artist_name
    from public.playback_sessions ps
    join public.tracks t on t.id=ps.track_id and t.status='approved'
    join public.artist_applications a on a.user_id=t.artist_id and a.status='approved'
    join public.listening_settings s on s.user_id=ps.user_id and s.analytics_enabled=true
    where ps.created_at>=v_start and ps.created_at<v_end
      and ps.played_seconds>= (case when t.duration_seconds between 1 and 59 then least(30,greatest(10,t.duration_seconds)*0.5) else 30 end)
      and (p_country='ALL' or ps.country_code=p_country)
      and (p_genre='Todos' or t.genre=p_genre)
  )
  select jsonb_build_object(
    'tracks',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select track_id,title,artist_id,artist_name,genre,count(*)::integer plays,
        count(distinct user_id)::integer listeners from qualified
      group by track_id,title,artist_id,artist_name,genre
      having count(distinct user_id)>=3
      order by plays desc,listeners desc,track_id limit 10
    ) r),'[]'::jsonb),
    'artists',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select artist_id,artist_name,count(*)::integer plays,
        count(distinct user_id)::integer listeners from qualified
      group by artist_id,artist_name having count(distinct user_id)>=3
      order by plays desc,listeners desc,artist_id limit 10
    ) r),'[]'::jsonb),
    'genres',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select genre,count(*)::integer plays,count(distinct user_id)::integer listeners
      from qualified group by genre having count(distinct user_id)>=3
      order by plays desc,listeners desc,genre limit 10
    ) r),'[]'::jsonb),
    'period',to_char(v_start at time zone 'UTC','YYYY-MM'),
    'country',p_country, 'genre',p_genre,
    'minimum_listeners',3
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_ovio_charts(integer,integer,text,text) from public,anon;
grant execute on function public.get_ovio_charts(integer,integer,text,text) to authenticated;

-- Resumen anual privado: 1 enero–24 noviembre (UTC); disponible como adelanto antes
-- del 25 de noviembre y como corte anual estable a partir de esa fecha.
-- IMPORTANTE: datos registrados únicamente desde que se activa esta versión.
create or replace function public.get_my_ovio_recap(p_year integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_uid uuid := (select auth.uid());
  v_begin timestamptz;
  v_cutoff timestamptz;
  v_end timestamptz;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  if p_year<2024 or p_year>extract(year from now())::integer then
    raise exception 'Año no válido';
  end if;
  if not exists(select 1 from public.listening_settings
    where user_id=v_uid and analytics_enabled=true) then
    return jsonb_build_object('enabled',false,'year',p_year);
  end if;
  v_begin:=make_date(p_year,1,1)::timestamptz;
  v_cutoff:=make_date(p_year,11,25)::timestamptz;
  v_end:=least(now(),v_cutoff);
  with own as (
    select t.id track_id,t.title,t.artist_id,t.genre,a.artist_name,
      ps.played_seconds, ps.user_id
    from public.playback_sessions ps
    join public.tracks t on t.id=ps.track_id and t.status='approved'
    join public.artist_applications a on a.user_id=t.artist_id and a.status='approved'
    where ps.user_id=v_uid and ps.created_at>=v_begin and ps.created_at<v_end
      and ps.played_seconds>0
  ), valid as (
    select * from own where played_seconds>=10
  )
  select jsonb_build_object(
    'enabled',true,'year',p_year,'final',now()>=v_cutoff,
    'cutoff',to_char(v_end at time zone 'UTC','YYYY-MM-DD'),
    'minutes',coalesce((select floor(sum(played_seconds)/60.0)::integer from own),0),
    'tracks_discovered',coalesce((select count(distinct track_id) from valid),0),
    'artists_discovered',coalesce((select count(distinct artist_id) from valid),0),
    'top_tracks',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select track_id,title,artist_id,artist_name,count(*)::integer sessions,
        sum(played_seconds)::integer seconds
      from valid group by track_id,title,artist_id,artist_name
      order by seconds desc,sessions desc,track_id limit 5
    ) r),'[]'::jsonb),
    'top_artists',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select artist_id,artist_name,sum(played_seconds)::integer seconds
      from valid group by artist_id,artist_name order by seconds desc,artist_id limit 5
    ) r),'[]'::jsonb),
    'top_genres',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select genre,sum(played_seconds)::integer seconds
      from valid group by genre order by seconds desc,genre limit 5
    ) r),'[]'::jsonb)
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_my_ovio_recap(integer) from public,anon;
grant execute on function public.get_my_ovio_recap(integer) to authenticated;

-- La baja del seguimiento elimina inmediatamente el historial nuevo.
create or replace function public.clear_ovio_tracking_on_optout()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (tg_op='DELETE') then
    delete from public.playback_sessions where user_id=old.user_id;
    return old;
  end if;
  if old.analytics_enabled=true and new.analytics_enabled=false then
    delete from public.playback_sessions where user_id=new.user_id;
  end if;
  return new;
end; $$;
drop trigger if exists clear_ovio_tracking_on_optout on public.listening_settings;
create trigger clear_ovio_tracking_on_optout after update of analytics_enabled or delete
  on public.listening_settings for each row execute function public.clear_ovio_tracking_on_optout();
