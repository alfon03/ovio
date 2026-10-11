-- OVIO v0.7 · estadísticas privadas del creador.
-- Migración incremental: ejecutar tras 001..005. No borra datos.
-- Solo devuelve agregados de canciones aprobadas del usuario autenticado.
-- Nunca devuelve identificadores de oyentes ni el historial crudo de reproducción.

create or replace function public.get_my_artist_insights(p_months integer default 6)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_start timestamptz;
  v_result jsonb;
  v_followers bigint;
  v_recent_followers bigint;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  if p_months is null or p_months < 1 or p_months > 12 then
    raise exception 'El periodo debe ser de 1 a 12 meses';
  end if;
  if not exists (
    select 1 from public.artist_applications
    where user_id=v_uid and status='approved'
  ) then
    raise exception 'Solo los artistas aprobados pueden consultar sus estadísticas';
  end if;

  -- Meses completos de calendario UTC, incluyendo el mes actual parcial.
  v_start := (date_trunc('month', now() at time zone 'UTC')
              - make_interval(months => p_months - 1)) at time zone 'UTC';

  select count(*), count(*) filter (where created_at >= now()-interval '30 days')
    into v_followers, v_recent_followers
  from public.follows where artist_id=v_uid;

  with my_tracks as (
    select id,title,genre,duration_seconds
    from public.tracks where artist_id=v_uid and status='approved'
  ), eligible as (
    select ps.track_id, ps.user_id, ps.played_seconds,
           (date_trunc('month',ps.created_at at time zone 'UTC'))::date as month_start,
           (ps.played_seconds >= case
             when t.duration_seconds between 1 and 59
             then least(30,greatest(10,t.duration_seconds)*0.5)
             else 30 end) as qualified
    from public.playback_sessions ps
    join my_tracks t on t.id=ps.track_id
    join public.listening_settings s on s.user_id=ps.user_id
      and s.analytics_enabled=true
    where ps.created_at>=v_start and ps.created_at<=now()
      and ps.played_seconds>0
  ), monthly as (
    select to_char(g.month_start,'YYYY-MM') as month,
      count(e.track_id) filter (where e.qualified)::integer as plays,
      count(distinct e.user_id) filter (where e.qualified)::integer as listeners,
      coalesce(floor(sum(e.played_seconds)/60.0),0)::integer as minutes
    from (select generate_series(
      (v_start at time zone 'UTC')::date,
      (date_trunc('month',now() at time zone 'UTC'))::date,
      interval '1 month')::date as month_start) g
    left join eligible e on e.month_start=g.month_start
    group by g.month_start
    order by g.month_start
  ), tracks_result as (
    select t.id as track_id, t.title, t.genre,
      count(e.track_id) filter (where e.qualified)::integer as plays,
      count(distinct e.user_id) filter (where e.qualified)::integer as listeners,
      coalesce(floor(sum(e.played_seconds)/60.0),0)::integer as minutes
    from my_tracks t left join eligible e on e.track_id=t.id
    group by t.id,t.title,t.genre
    order by plays desc,minutes desc,t.title
    limit 50
  )
  select jsonb_build_object(
    'period_months',p_months,
    'from',to_char(v_start at time zone 'UTC','YYYY-MM-DD'),
    'to',to_char(now() at time zone 'UTC','YYYY-MM-DD'),
    'summary',jsonb_build_object(
      'plays',coalesce((select count(*) from eligible where qualified),0),
      'listeners',coalesce((select count(distinct user_id) from eligible where qualified),0),
      'minutes',coalesce((select floor(sum(played_seconds)/60.0) from eligible),0),
      'approved_tracks',(select count(*) from my_tracks),
      'followers',v_followers,
      'current_followers_joined_last_30d',v_recent_followers
    ),
    'months',coalesce((select jsonb_agg(to_jsonb(m) order by m.month)
       from monthly m),'[]'::jsonb),
    'tracks',coalesce((select jsonb_agg(to_jsonb(t))
       from tracks_result t),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_my_artist_insights(integer) from public, anon;
grant execute on function public.get_my_artist_insights(integer) to authenticated;

comment on function public.get_my_artist_insights(integer) is
'Agregados de escuchas de canciones aprobadas del artista autenticado; sin datos individuales de oyentes. Solo sesiones con consentimiento activo.';
