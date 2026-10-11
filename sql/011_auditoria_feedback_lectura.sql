-- SOLO LECTURA. Ejecutar DESPUÉS de 011_feedback_beta.sql.
select 'tabla con RLS activada' as comprobacion, relrowsecurity as correcto
from pg_class where oid='public.beta_feedback'::regclass;
select policyname,cmd,roles,qual,with_check
from pg_policies where schemaname='public' and tablename='beta_feedback'
order by policyname;
select privilege_type, grantee
from information_schema.role_table_grants
where table_schema='public' and table_name='beta_feedback'
order by grantee, privilege_type;
-- IMPORTANTE: la auditoría de catálogo no prueba que una cuenta diferente sea rechazada.
-- Para comprobarlo hay que efectuar pruebas autenticadas con dos cuentas reales.
