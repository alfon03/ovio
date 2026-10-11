-- OVIO v0.8. Ejecutar UNA VEZ después de 001–006.
-- El progreso se guarda por usuario y canción solo si la persona activa la función.
-- No se utiliza para rankings, minutos anuales ni remuneraciones.

create table if not exists public.playback_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 resume_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.playback_preferences enable row level security;
revoke all on public.playback_preferences from anon, authenticated;
grant select, insert, update, delete on public.playback_preferences to authenticated;
drop policy if exists playback_preferences_own on public.playback_preferences;
create policy playback_preferences_own on public.playback_preferences for all to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create table if not exists public.playback_bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade,
 track_id uuid not null references public.tracks(id) on delete cascade,
 position_seconds integer not null check(position_seconds between 1 and 36000),
 updated_at timestamptz not null default now(),
 primary key(user_id, track_id)
);
create index if not exists playback_bookmarks_recent on public.playback_bookmarks(user_id,updated_at desc);
alter table public.playback_bookmarks enable row level security;
revoke all on public.playback_bookmarks from anon, authenticated;
grant select,insert,update,delete on public.playback_bookmarks to authenticated;
drop policy if exists playback_bookmarks_select on public.playback_bookmarks;
create policy playback_bookmarks_select on public.playback_bookmarks for select to authenticated
 using (user_id=(select auth.uid()));
drop policy if exists playback_bookmarks_insert on public.playback_bookmarks;
create policy playback_bookmarks_insert on public.playback_bookmarks for insert to authenticated
 with check (user_id=(select auth.uid())
 and exists (select 1 from public.playback_preferences p where p.user_id=(select auth.uid()) and p.resume_enabled)
 and exists (select 1 from public.tracks t where t.id=track_id and t.status='approved'));
drop policy if exists playback_bookmarks_update on public.playback_bookmarks;
create policy playback_bookmarks_update on public.playback_bookmarks for update to authenticated
 using (user_id=(select auth.uid()))
 with check (user_id=(select auth.uid())
 and exists (select 1 from public.playback_preferences p where p.user_id=(select auth.uid()) and p.resume_enabled)
 and exists (select 1 from public.tracks t where t.id=track_id and t.status='approved'));
drop policy if exists playback_bookmarks_delete on public.playback_bookmarks;
create policy playback_bookmarks_delete on public.playback_bookmarks for delete to authenticated
 using (user_id=(select auth.uid()));

-- Opcional: el usuario puede eliminar todos sus puntos guardados desde la app.
-- No se concede acceso a las posiciones de otras personas ni se crean vistas públicas.
