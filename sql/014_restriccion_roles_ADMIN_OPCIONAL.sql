-- OVIO 2.0 · Endurecimiento de roles (opcional si la auditoría marca los permisos).
-- Ejecutar SOLO después de leer la auditoría y disponer de respaldo de base de datos.
-- No cambia políticas RLS ni asigna o elimina administradores.
-- No modifica usuarios, artistas, canciones, playlists o letras.
begin;
revoke insert, update, delete on table public.admin_users from anon, authenticated;
revoke insert, update, delete on table public.moderation_log from anon, authenticated;
commit;
