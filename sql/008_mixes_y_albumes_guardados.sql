-- OVIO v0.9. EJECUTAR UNA SOLA VEZ despues de 001–007.
-- Solo añade álbumes guardados; los mixes se calculan al iniciar sesión
-- y solo se escriben en playlists existentes cuando el usuario los guarda.
create table if not exists public.saved_releases (
  user_id uuid not null references auth.users(id) on delete cascade,
  release_id uuid not null references public.releases(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,release_id)
);
create index if not exists saved_releases_user_recent_idx
  on public.saved_releases(user_id,created_at desc);
alter table public.saved_releases enable row level security;
revoke all on public.saved_releases from anon,authenticated;
grant select, insert, delete on public.saved_releases to authenticated;

drop policy if exists saved_releases_select_own on public.saved_releases;
create policy saved_releases_select_own on public.saved_releases
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists saved_releases_insert_own_public on public.saved_releases;
create policy saved_releases_insert_own_public on public.saved_releases
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.tracks t
      where t.release_id = saved_releases.release_id and t.status = 'approved')
  );

drop policy if exists saved_releases_delete_own on public.saved_releases;
create policy saved_releases_delete_own on public.saved_releases
  for delete to authenticated using (user_id = (select auth.uid()));
-- Sin UPDATE y sin acceso de lectura a guardados de otras cuentas.
