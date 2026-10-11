-- OVIO v2.0 · Auditoría SOLO LECTURA para registro público.
-- Ejecutar en Supabase → SQL Editor tras las migraciones 001-013.
-- No modifica registros, usuarios, buckets ni permisos. No contiene datos personales.
-- 'OK' = la condición estructural comprobada se cumple; NO sustituye pruebas con dos cuentas.
WITH controles AS (
  SELECT 'RLS'::text AS grupo, c.relname::text AS control,
         CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'REVISAR' END AS estado,
         CASE WHEN c.relrowsecurity THEN 'RLS activo' ELSE 'RLS desactivado en tabla public' END AS detalle
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  UNION ALL
  SELECT 'Almacenamiento', b.id,
         CASE WHEN b.public=false THEN 'OK' ELSE 'REVISAR' END,
         CASE WHEN b.public=false THEN 'Bucket privado' ELSE 'El bucket permite URLs públicas' END
  FROM storage.buckets b WHERE b.id IN ('song-audio','song-evidence')
  UNION ALL
  SELECT 'Almacenamiento', v.id,
         CASE WHEN EXISTS(SELECT 1 FROM storage.buckets b WHERE b.id=v.id) THEN 'OK' ELSE 'REVISAR' END,
         'Comprobar que existe el bucket protegido'
  FROM (VALUES ('song-audio'),('song-evidence')) v(id)
  UNION ALL
  SELECT 'Privacidad', 'artist_lyric_drafts RLS',
         CASE WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=to_regclass('public.artist_lyric_drafts') AND c.relrowsecurity AND c.relforcerowsecurity)
              THEN 'OK' ELSE 'REVISAR' END,
         'Las letras privadas deben tener RLS y FORCE RLS'
  UNION ALL
  SELECT 'Privacidad', 'artist_lyric_drafts propietario',
         CASE WHEN (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='artist_lyric_drafts' AND policyname LIKE 'artist_lyric_drafts_private_%')=4 THEN 'OK' ELSE 'REVISAR' END,
         'Se esperan 4 políticas (leer, crear, editar, borrar)'
  UNION ALL
  SELECT 'Moderación', 'tracks_review',
         CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tracks' AND policyname='tracks_review' AND cmd='UPDATE') THEN 'OK' ELSE 'REVISAR' END,
         'Verificar con cuenta no administradora que no puede aprobar'
  UNION ALL
  SELECT 'Moderación', 'artists_review',
         CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='artist_applications' AND policyname='artists_review' AND cmd='UPDATE') THEN 'OK' ELSE 'REVISAR' END,
         'Verificar con cuenta no administradora que no puede aprobar'
  UNION ALL
  SELECT 'Privilegios', 'admin_users no escritura autenticada',
         CASE WHEN COALESCE(has_table_privilege('authenticated',to_regclass('public.admin_users'),'INSERT'),false)
                OR COALESCE(has_table_privilege('authenticated',to_regclass('public.admin_users'),'UPDATE'),false)
                OR COALESCE(has_table_privilege('authenticated',to_regclass('public.admin_users'),'DELETE'),false)
              THEN 'REVISAR' ELSE 'OK' END,
         'Un usuario autenticado no debe poder asignarse como admin por API'
  UNION ALL
  SELECT 'Privilegios','letras no accesibles para anon',
         CASE WHEN COALESCE(has_table_privilege('anon',to_regclass('public.artist_lyric_drafts'),'SELECT'),false)
                OR COALESCE(has_table_privilege('anon',to_regclass('public.artist_lyric_drafts'),'INSERT'),false)
              THEN 'REVISAR' ELSE 'OK' END,
         'El rol anon no debe leer ni escribir borradores privados'
  UNION ALL
  SELECT 'Identidad','índices únicos de registro',
         CASE WHEN (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('ovio_profiles_username_unique','ovio_artist_active_name_unique') AND indexdef ILIKE 'CREATE UNIQUE INDEX%')=2 THEN 'OK' ELSE 'REVISAR' END,
         'Índices UNIQUE para nombres de usuario y artísticos'
)
SELECT grupo,control,estado,detalle FROM controles ORDER BY (estado='REVISAR') DESC,grupo,control;
