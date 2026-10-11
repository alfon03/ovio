-- Verificar tras ejecutar 013; no modifica datos.
select c.relname as tablename, c.relrowsecurity as rowsecurity,
       c.relforcerowsecurity as forcerowsecurity
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='artist_lyric_drafts';
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename='artist_lyric_drafts'
order by policyname;
select grantee,privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name='artist_lyric_drafts'
order by grantee,privilege_type;
