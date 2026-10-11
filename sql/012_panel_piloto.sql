-- OVIO v1.5 · panel de seguimiento de la beta.
-- Ejecutar DESPUÉS de 011 en el MISMO proyecto de Supabase.
-- Lee datos agregados sin cambiar ni borrar registros existentes.
-- Solo admins existentes pueden ejecutar la función (verificación en servidor).
begin;

create or replace function public.get_ovio_pilot_overview()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select public.is_admin()) then
    raise exception 'Solo el equipo administrador puede consultar estas cifras'
      using errcode='42501';
  end if;

  return pg_catalog.jsonb_build_object(
    'registered_users', (select count(*) from public.profiles),
    'new_users_7d', (select count(*) from public.profiles where created_at >= now()-interval '7 days'),
    'artists_approved', (select count(*) from public.artist_applications where status='approved'),
    'artists_pending', (select count(*) from public.artist_applications where status='pending'),
    'tracks_approved', (select count(*) from public.tracks where status='approved'),
    'tracks_pending', (select count(*) from public.tracks where status='pending'),
    'feedback_open', (select count(*) from public.beta_feedback where status='open'),
    'feedback_reviewing', (select count(*) from public.beta_feedback where status='reviewing'),
    'feedback_resolved', (select count(*) from public.beta_feedback where status='resolved'),
    'listening_minutes_7d', (
      select coalesce(floor(sum(ps.played_seconds)::numeric/60),0)
      from public.playback_sessions ps
      join public.listening_settings ls on ls.user_id=ps.user_id and ls.analytics_enabled=true
      join public.tracks t on t.id=ps.track_id and t.status='approved'
      where ps.created_at >= now()-interval '7 days'
    ),
    'valid_plays_7d', (
      select count(*) from public.playback_sessions ps
      join public.listening_settings ls on ls.user_id=ps.user_id and ls.analytics_enabled=true
      join public.tracks t on t.id=ps.track_id and t.status='approved'
      where ps.created_at>=now()-interval '7 days' and ps.played_seconds>=30
    ),
    'active_listeners_7d', (
      select count(distinct ps.user_id) from public.playback_sessions ps
      join public.listening_settings ls on ls.user_id=ps.user_id and ls.analytics_enabled=true
      join public.tracks t on t.id=ps.track_id and t.status='approved'
      where ps.created_at>=now()-interval '7 days' and ps.played_seconds>=30
    ),
    'calculated_at', now()
  );
end; $$;

-- PostgreSQL concede EXECUTE a PUBLIC por defecto si no se revoca.
revoke all on function public.get_ovio_pilot_overview() from public, anon;
grant execute on function public.get_ovio_pilot_overview() to authenticated;
commit;
