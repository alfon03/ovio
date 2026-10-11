-- OVIO Beta v1.2: auditoría SOLO LECTURA. NO altera datos ni permisos.
-- Pegar en Supabase > SQL Editor tras ejecutar 010. Resultado esperado: todo OK.
with checks as (
  select 'RLS · perfiles' as control, coalesce((select relrowsecurity from pg_class where oid='public.profiles'::regclass),false) as ok
  union all select 'RLS · solicitudes de artista', (select relrowsecurity from pg_class where oid='public.artist_applications'::regclass)
  union all select 'RLS · canciones', (select relrowsecurity from pg_class where oid='public.tracks'::regclass)
  union all select 'RLS · playlists', (select relrowsecurity from pg_class where oid='public.playlists'::regclass)
  union all select 'RLS · pruebas de copyright (tabla)', (select relrowsecurity from pg_class where oid='public.copyright_reports'::regclass)
  union all select 'Bucket audio privado', coalesce((select not public from storage.buckets where id='song-audio'),false)
  union all select 'Bucket documentos privados', coalesce((select not public from storage.buckets where id='song-evidence'),false)
  union all select 'Índice único · usuarios', exists(select 1 from pg_indexes where schemaname='public' and indexname='ovio_profiles_username_unique' and indexdef ilike '%unique%')
  union all select 'Índice único · artistas', exists(select 1 from pg_indexes where schemaname='public' and indexname='ovio_artist_active_name_unique' and indexdef ilike '%unique%')
  union all select 'Usuario no puede editar created_at', not has_column_privilege('authenticated','public.profiles','created_at','UPDATE')
  union all select 'Usuario no puede editar ID de perfil', not has_column_privilege('authenticated','public.profiles','id','UPDATE')
  union all select 'Usuario no puede aprobarse como artista vía RLS', exists(
    select 1 from pg_policies where schemaname='public' and tablename='artist_applications' and policyname='artists_review' and cmd='UPDATE' and qual like '%is_admin%'
  )
  union all select 'Audio con lectura restringida', exists(
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='audio_read' and cmd='SELECT'
  )
  union all select 'Documentos con lectura restringida', exists(
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='evidence_read' and cmd='SELECT'
  )
  union all select 'No hay borrado de canciones desde cliente', not has_table_privilege('authenticated','public.tracks','DELETE')
  union all select 'Sin edición directa de autoría de canciones', not has_column_privilege('authenticated','public.tracks','rights_original','UPDATE')
)
select control, case when ok then 'OK' else 'REVISAR' end as resultado
from checks
order by (case when ok then 1 else 0 end),control;
